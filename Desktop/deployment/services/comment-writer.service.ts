import { createInstallationClient } from '@/lib/github';
import { OpenAIService } from './openai.service';
import { logger } from '@/utils/logger';

export class CommentWriterService {
  /**
   * Write an AI-generated comment to a random file in the repository
   */
  async writeCommentToRandomFile(
    installationId: string,
    repoOwner: string,
    repoName: string
  ): Promise<{ filename: string; comment: string; commitSha: string }> {
    logger.info('🤖 [CommentWriter] Starting AI comment writer', {
      repo: `${repoOwner}/${repoName}`,
    });

    // 1. Create GitHub client (convert string ID to number)
    const octokit = await createInstallationClient(parseInt(installationId, 10));

    // 2. Get repository default branch
    const { data: repo } = await octokit.rest.repos.get({
      owner: repoOwner,
      repo: repoName,
    });
    const defaultBranch = repo.default_branch || 'main';

    // 3. Get tree of files from default branch
    const { data: branchData } = await octokit.rest.repos.getBranch({
      owner: repoOwner,
      repo: repoName,
      branch: defaultBranch,
    });

    const { data: tree } = await octokit.rest.git.getTree({
      owner: repoOwner,
      repo: repoName,
      tree_sha: branchData.commit.sha,
      recursive: 'true',
    });

    // 4. Filter for code files we can comment
    const commentableFiles = tree.tree.filter((file) => {
      if (file.type !== 'blob') return false;
      
      const path = file.path || '';
      
      // Include common code file extensions
      const validExtensions = [
        '.ts', '.tsx', '.js', '.jsx',
        '.py', '.java', '.go', '.rs',
        '.cpp', '.c', '.h', '.cs',
        '.rb', '.php', '.swift', '.kt',
      ];
      
      // Exclude node_modules, build dirs, lock files
      const excludePatterns = [
        'node_modules/',
        'dist/',
        'build/',
        '.next/',
        'package-lock.json',
        'yarn.lock',
        '.git/',
      ];
      
      if (excludePatterns.some(pattern => path.includes(pattern))) {
        return false;
      }
      
      return validExtensions.some(ext => path.endsWith(ext));
    });

    if (commentableFiles.length === 0) {
      throw new Error('No suitable files found for commenting');
    }

    // 5. Select random file
    const randomFile = commentableFiles[Math.floor(Math.random() * commentableFiles.length)];
    const selectedPath = randomFile.path!;

    logger.info('🎯 [CommentWriter] Selected file', { path: selectedPath });

    // 6. Fetch file content
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path: selectedPath,
      ref: defaultBranch,
    });

    if (!('content' in fileData)) {
      throw new Error('Selected file has no content');
    }

    const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const currentSha = fileData.sha;

    // 7. Generate AI comment
    const aiComment = await this.generateComment(selectedPath, currentContent);

    // 8. Add comment to file
    const newContent = this.addCommentToFile(currentContent, aiComment, selectedPath);

    // 9. Commit to GitHub
    const { data: commitData } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: selectedPath,
      message: '🤖 AutoFix AI: Added analysis comment',
      content: Buffer.from(newContent).toString('base64'),
      sha: currentSha,
      branch: defaultBranch,
    });

    logger.info('✅ [CommentWriter] Successfully wrote AI comment', {
      file: selectedPath,
      commitSha: commitData.commit.sha,
    });

    return {
      filename: selectedPath,
      comment: aiComment,
      commitSha: commitData.commit.sha || '',
    };
  }

  /**
   * Generate an AI comment for the file
   */
  private async generateComment(filename: string, fileContent: string): Promise<string> {
    try {
      const openAI = new OpenAIService();
      
      const prompt = `You are analyzing a code file. Write a SHORT, friendly comment (max 1 line, under 80 characters) about this file.

File: ${filename}
Content preview:
${fileContent.slice(0, 500)}

Return ONLY the comment text, no quotes, no markdown. Keep it brief and relevant.`;

      const responseText = await openAI.getCompletion({
        messages: [
          { role: 'system', content: 'You write brief, helpful code comments.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      // Clean up response
      let comment = responseText.trim();
      comment = comment.replace(/^["']|["']$/g, ''); // Remove quotes
      comment = comment.split('\n')[0]; // Take first line only
      
      // Truncate if too long
      if (comment.length > 80) {
        comment = comment.slice(0, 77) + '...';
      }

      return comment || 'AI-analyzed code file';
    } catch (error) {
      logger.error('[CommentWriter] AI generation failed, using fallback', { error });
      return 'Analyzed by AutoFix AI';
    }
  }

  /**
   * Add comment at the top of the file
   */
  private addCommentToFile(content: string, comment: string, filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    let commentSyntax = '//';
    
    // Determine comment syntax based on file extension
    if (extension === 'py' || extension === 'rb') {
      commentSyntax = '#';
    } else if (extension === 'html' || extension === 'xml') {
      return `<!-- 🤖 AutoFix AI (${timestamp}): ${comment} -->\n${content}`;
    }
    
    const aiCommentLine = `${commentSyntax} 🤖 AutoFix AI (${timestamp}): ${comment}\n`;
    
    return aiCommentLine + content;
  }
}
