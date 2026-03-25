import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { createInstallationClient } from '@/lib/github';
import { encryptToken } from '@/lib/encryption';
import { VercelAutoDeployService } from '@/lib/vercel-auto-deploy';
import { createAppAuth } from '@octokit/auth-app';
import { logger } from '@/utils/logger';

const schema = z.object({
  installationId: z.number(),
  repoOwner: z.string(),
  repoName: z.string(),
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

    const { installationId, repoOwner, repoName } = validation.data;

    // Get installation token using GitHub App credentials
    const auth = createAppAuth({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    });

    const installationAuth = await auth({
      type: 'installation',
      installationId,
    });

    const token = installationAuth.token;
    const expiresAt = installationAuth.expiresAt;

    // Encrypt installation token
    const encryptedToken = await encryptToken(token);

    // Store installation in database
    const { data: installation, error: insertError } = await supabaseAdmin
      .from('github_installations')
      .insert({
        user_id: userId,
        installation_id: installationId,
        repo_owner: repoOwner,
        repo_name: repoName,
        installation_token: encryptedToken,
        token_expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to store installation', { error: insertError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    logger.info('GitHub installation connected', {
      userId,
      installationId,
      repo: `${repoOwner}/${repoName}`,
    });

    // 🚀 NEW: Automatically deploy to Vercel!
    try {
      logger.info('🚀 Starting automatic Vercel deployment', {
        repo: `${repoOwner}/${repoName}`,
      });

      const autoDeployService = new VercelAutoDeployService();
      const deploymentResult = await autoDeployService.autoDeployRepository({
        userId,
        githubInstallationId: installation.id,
        installationId,
        repoOwner,
        repoName,
      });

      logger.info('✅ Auto-deployment successful', {
        vercelProjectId: deploymentResult.vercelProjectId,
        deploymentId: deploymentResult.deploymentId,
        deploymentUrl: deploymentResult.deploymentUrl,
      });

      return NextResponse.json({
        success: true,
        installation,
        vercelProject: {
          id: deploymentResult.vercelProjectId,
          deploymentUrl: deploymentResult.deploymentUrl,
          deploymentId: deploymentResult.deploymentId,
        },
      });
    } catch (deployError) {
      // If auto-deployment fails, still return success for GitHub connection
      // User can manually connect Vercel later or we'll retry
      logger.error('Auto-deployment failed, but GitHub connected successfully', {
        error: String(deployError),
      });

      return NextResponse.json({
        success: true,
        installation,
        warning: 'GitHub connected but auto-deployment failed. Please check Vercel configuration.',
        error: String(deployError),
      });
    }
  } catch (error) {
    logger.error('Connect repo error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
