#!/usr/bin/env node

/**
 * GitHub Write Access Test Script
 * 
 * Simple standalone test to verify GitHub App can write to repositories.
 * 
 * Usage:
 *   npm run test:github -- --owner=Arkin26 --repo=autofix-test --installationId=103022850
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

async function testGitHubWrite() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING GITHUB WRITE ACCESS');
    console.log('='.repeat(60) + '\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const getArg = (name: string) => {
      const arg = args.find(a => a.startsWith(`--${name}=`));
      return arg?.split('=')[1];
    };

    const owner = getArg('owner');
    const repo = getArg('repo');
    const installationId = getArg('installationId');

    if (!owner || !repo || !installationId) {
      console.error('❌ MISSING REQUIRED PARAMETERS\n');
      console.error('Usage:');
      console.error('  npm run test:github -- --owner=USERNAME --repo=REPO_NAME --installationId=ID\n');
      process.exit(1);
    }

    console.log(`📁 Repository: ${owner}/${repo}`);
    console.log(`🔑 Installation ID: ${installationId}\n`);

    // Read environment variables
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
      console.error('❌ FAILED: Missing environment variables');
      console.error('Required: GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY in .env.local\n');
      process.exit(1);
    }

    // ========================================
    // STEP 1: Authenticate with GitHub App
    // ========================================
    console.log('🔑 STEP 1: Authenticating with GitHub App...');
    
    // Dynamic import to avoid tsx module resolution issues
    const { Octokit } = await import('@octokit/rest');
    const { createAppAuth } = await import('@octokit/auth-app');

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        installationId: parseInt(installationId, 10),
      },
    });

    console.log('✅ SUCCESS: Authenticated with GitHub\n');

    // ========================================
    // STEP 2: Get Repository Info
    // ========================================
    console.log('📖 STEP 2: Getting repository information...');
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;
    console.log(`✅ SUCCESS: Default branch is "${defaultBranch}"`);
    console.log(`   Repository: ${repoData.full_name}`);
    console.log(`   Private: ${repoData.private ? 'Yes' : 'No'}\n`);

    // ========================================
    // STEP 3: Get Latest Commit SHA
    // ========================================
    console.log('📍 STEP 3: Getting latest commit SHA...');
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const latestCommitSha = refData.object.sha;
    console.log(`✅ SUCCESS: Latest commit is ${latestCommitSha.substring(0, 7)}\n`);

    // ========================================
    // STEP 4: Create Test Branch
    // ========================================
    const newBranchName = `debug/github-write-test-${Date.now()}`;
    console.log(`🌿 STEP 4: Creating test branch "${newBranchName}"...`);
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranchName}`,
      sha: latestCommitSha,
    });
    console.log(`✅ SUCCESS: Branch created\n`);

    // ========================================
    // STEP 5: Read README.md
    // ========================================
    console.log('📝 STEP 5: Reading README.md...');
    const { data: fileData } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'README.md',
      ref: newBranchName,
    }) as any;

    if (!fileData.content) {
      throw new Error('README.md has no content');
    }

    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    console.log(`✅ SUCCESS: File read (${content.length} bytes)\n`);

    // ========================================
    // STEP 6: Modify Content
    // ========================================
    console.log('✏️  STEP 6: Adding test comment to file...');
    const testComment = `<!-- 🧪 GitHub Write Test: ${new Date().toISOString()} -->\n`;
    const newContent = testComment + content;
    console.log(`✅ SUCCESS: Content prepared (added ${testComment.length} bytes)\n`);

    // ========================================
    // STEP 7: Commit Changes
    // ========================================
    console.log('💾 STEP 7: Committing changes to GitHub...');
    const { data: commitData } = await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: '🧪 Test: Verify GitHub write access',
      content: Buffer.from(newContent).toString('base64'),
      branch: newBranchName,
      sha: fileData.sha,
    });
    const commitSha = commitData.commit.sha || 'unknown';
    console.log(`✅ SUCCESS: Changes committed (${commitSha.substring(0, 7)})\n`);

    // ========================================
    // SUCCESS!
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED - GITHUB WRITE ACCESS CONFIRMED');
    console.log('='.repeat(60));
    console.log(`\n✅ Successfully created branch and committed changes`);
    console.log(`\n📂 Modified file: README.md`);
    console.log(`🌿 Branch: ${newBranchName}`);
    console.log(`💾 Commit: ${commitSha.substring(0, 7)}`);
    console.log(`\n🔗 View on GitHub:`);
    console.log(`   https://github.com/${owner}/${repo}/tree/${newBranchName}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   - Visit the URL above to see your test branch`);
    console.log(`   - Delete the test branch when done (it contains only a test comment)`);
    console.log(`   - Your GitHub App has proper write permissions! 🎊`);
    console.log('\n' + '='.repeat(60) + '\n');

    process.exit(0);

  } catch (error: any) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ FAILED: GitHub write test failed');
    console.error('='.repeat(60) + '\n');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('\nHTTP Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.error('\n' + '='.repeat(60));
    console.error('💡 Common issues:');
    console.error('   - Wrong installation ID');
    console.error('   - GitHub App not installed on repository');
    console.error('   - Missing "Contents: Write" permission in GitHub App settings');
    console.error('   - Invalid GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY');
    console.error('='.repeat(60) + '\n');
    
    process.exit(1);
  }
}

// Run the test
testGitHubWrite();
