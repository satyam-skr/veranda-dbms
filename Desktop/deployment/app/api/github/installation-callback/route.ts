import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createInstallationClient } from '@/lib/github';
import { encryptToken } from '@/lib/encryption';
import { logger } from '@/utils/logger';
import { VercelAutoDeployService } from '@/lib/vercel-auto-deploy';

/**
 * GitHub App Installation Callback
 * This is called after user installs the GitHub App and selects repositories
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');

    logger.info('🔵 GitHub App installation callback', {
      installationId,
      setupAction,
    });

    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      logger.error('No user_id cookie found');
      return NextResponse.redirect(new URL('/?error=not_authenticated', request.url));
    }

    if (!installationId) {
      logger.error('No installation_id provided');
      return NextResponse.redirect(new URL('/?error=no_installation', request.url));
    }

    // Get installation client
    const octokit = await createInstallationClient(Number(installationId));

    // Get list of repositories from the installation
    const reposResponse = await octokit.request('GET /installation/repositories');
    const reposData = reposResponse.data;

    logger.info('📦 GitHub API Response', {
      total_count: reposData.total_count,
      repo_count: reposData.repositories.length,
      repo_names: reposData.repositories.map((r: any) => r.full_name),
      raw_response_keys: Object.keys(reposData)
    });

    // Get installation token for storage
    const auth: any = await octokit.auth({ type: 'installation' });
    const encryptedToken = await encryptToken(auth.token);

    // For each repository, create an installation record
    for (const repo of reposData.repositories) {
      const repoOwner = repo.owner.login;
      const repoName = repo.name;

      logger.info(`📝 Processing repo loop: ${repoOwner}/${repoName}`, {
        id: repo.id,
        private: repo.private
      });

      // Check if installation already exists
      const { data: existing } = await supabaseAdmin
        .from('github_installations')
        .select('id')
        .eq('user_id', userId)
        .eq('installation_id', Number(installationId))
        .eq('repo_owner', repoOwner)
        .eq('repo_name', repoName)
        .single();

      if (existing) {
        logger.info(`⏭️ Installation already exists for ${repoOwner}/${repoName}`);
        
        // Even if installation exists, we might want to trigger auto-deploy if no vercel project exists
        try {
          logger.info(`🚀 Checking auto-deployment for existing repo ${repoOwner}/${repoName}`);
          
          const autoDeployService = new VercelAutoDeployService();
          // Run in background
          autoDeployService.autoDeployRepository({
            userId,
            githubInstallationId: existing.id,
            installationId: Number(installationId),
            repoOwner,
            repoName,
          }).catch(err => logger.error('Background auto-deploy failed', { error: String(err) }));
        } catch (e) {
          // ignore
        }
        
        continue;
      }

      // Store installation in database
      const { data: installationRecord, error: insertError } = await supabaseAdmin
        .from('github_installations')
        .insert({
          user_id: userId,
          installation_id: Number(installationId),
          repo_owner: repoOwner,
          repo_name: repoName,
          installation_token: encryptedToken,
          token_expires_at: auth.expiresAt,
        })
        .select()
        .single();

      if (insertError || !installationRecord) {
        logger.error('Failed to store installation', { error: insertError });
        continue;
      }

      logger.info('✅ GitHub installation stored', {
        repo: `${repoOwner}/${repoName}`,
      });

      // 🚀 Auto-deploy to Vercel!
      try {
        logger.info(`🚀 Starting auto-deployment for ${repoOwner}/${repoName}`);

        const autoDeployService = new VercelAutoDeployService();
        // Run in background (don't await) to allow fast redirect
        autoDeployService.autoDeployRepository({
          userId,
          githubInstallationId: installationRecord.id,
          installationId: Number(installationId),
          repoOwner,
          repoName,
        }).then((result: any) => {
          logger.info('✅ Background auto-deployment successful', {
            repo: `${repoOwner}/${repoName}`,
            vercelProjectId: result.vercelProjectId,
          });
        }).catch((deployError: any) => {
          logger.error('Background auto-deployment failed', {
            error: String(deployError),
            repo: `${repoOwner}/${repoName}`,
          });
        });

      } catch (deployError) {
        logger.error('Auto-deployment trigger failed', {
          error: String(deployError),
          repo: `${repoOwner}/${repoName}`,
        });
      }
    }

    // Redirect to dashboard
    logger.info('🎉 Installation complete, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    logger.error('GitHub installation callback error', { error: String(error) });
    return NextResponse.redirect(new URL('/?error=installation_failed', request.url));
  }
}
