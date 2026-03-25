import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { VercelClient } from '@/lib/vercel';
import { encryptToken } from '@/lib/encryption';
import { logger } from '@/utils/logger';
import { CommentWriterService } from '@/services/comment-writer.service';

const schema = z.object({
  githubInstallationId: z.string().uuid(),
  projectId: z.string(),
  vercelToken: z.string(),
  deployHookUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request', details: validation.error }, { status: 400 });
    }

    const { githubInstallationId, projectId, vercelToken, deployHookUrl } = validation.data;

    // Verify GitHub installation belongs to user
    const { data: installation, error: installError } = await supabaseAdmin
      .from('github_installations')
      .select('*')
      .eq('id', githubInstallationId)
      .eq('user_id', userId)
      .single();

    if (installError || !installation) {
      return NextResponse.json({ error: 'GitHub installation not found' }, { status: 404 });
    }

    // Validate Vercel token by fetching project
    const vercelClient = new VercelClient(vercelToken);
    let projectData;

    try {
      projectData = await vercelClient.getProject(projectId);
    } catch (vercelError) {
      logger.error('Vercel token validation failed', { error: String(vercelError) });
      return NextResponse.json({ error: 'Invalid Vercel token or project ID' }, { status: 400 });
    }

    // Encrypt Vercel token
    const encryptedToken = await encryptToken(vercelToken);

    // Store Vercel project in database
    const { data: project, error: insertError } = await supabaseAdmin
      .from('vercel_projects')
      .insert({
        user_id: userId,
        github_installation_id: githubInstallationId,
        project_id: projectId,
        project_name: projectData.name,
        vercel_token: encryptedToken,
        deploy_hook_url: deployHookUrl,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to store Vercel project', { error: insertError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    logger.info('Vercel project connected', {
      userId,
      projectId,
      projectName: projectData.name,
    });

    // 🕸️ Register Vercel Webhook for instant failure detection
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autofix-platform.vercel.app';
      const webhookUrl = `${appUrl}/api/webhooks/vercel`;
      
      logger.info('Registering Vercel webhook...', { webhookUrl });
      await vercelClient.createWebhook(projectId, webhookUrl);
      logger.info('Vercel webhook registered successfully');
    } catch (webhookRegError) {
      // Log but don't fail the whole connection if webhook registration fails
      logger.error('Failed to register Vercel webhook', { 
        error: String(webhookRegError),
        projectId 
      });
      console.error('⚠️  Webhook registration failed (continuing):', String(webhookRegError));
    }

    // ✨ NEW: Write AI comment to random file (non-blocking)
    try {
      const commentWriter = new CommentWriterService();
      const result = await commentWriter.writeCommentToRandomFile(
        installation.installation_id,
        installation.repo_owner,
        installation.repo_name
      );
      
      // Log to console for user visibility
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✨ AI Comment written to: ${result.filename}`);
      console.log(`📝 Comment: ${result.comment}`);
      console.log(`🔗 Commit: ${result.commitSha.slice(0, 7)}`);
      console.log(`${'='.repeat(60)}\n`);
      
      logger.info('AI comment written on deploy', {
        filename: result.filename,
        comment: result.comment,
        repo: `${installation.repo_owner}/${installation.repo_name}`,
      });
    } catch (commentError) {
      // Non-blocking - log error but continue with successful deployment
      console.error('⚠️  Failed to write AI comment (non-critical):', String(commentError));
      logger.error('Failed to write AI comment (non-critical)', { 
        error: String(commentError) 
      });
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    logger.error('Connect Vercel error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
