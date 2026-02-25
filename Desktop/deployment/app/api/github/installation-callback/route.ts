import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { createInstallationClient } from '@/lib/github';
import { createAppAuth } from '@octokit/auth-app';
import { encryptToken } from '@/lib/encryption';
import { logger } from '@/utils/logger';
import { VercelAutoDeployService } from '@/lib/vercel-auto-deploy';

/**
 * GitHub App Installation Callback
 * Called after user installs the GitHub App and selects repositories.
 *
 * PRODUCTION FIX: On Vercel, the browser may not send the `user_id` cookie
 * when GitHub redirects back (cross-origin navigation + cookie security policies).
 * To fix this, we pass `state={userId}` to GitHub, which returns it here.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const installationId = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');
    const state = searchParams.get('state');

    logger.info('🔵 GitHub App installation callback', {
      installationId,
      setupAction,
      state
    });

    if (!installationId) {
      logger.error('No installation_id provided');
      return NextResponse.redirect(new URL('/?error=no_installation', request.url));
    }

    // ─── Step 1: Resolve user ID ───────────────────────────────────
    // Priority: 1. State param (Passed securely from connect page / recovered from localStorage)
    //           2. Cookie (Fallback)
    //           3. GitHub Account Lookup (Last resort)
    
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get('user_id')?.value || request.cookies.get('user_id')?.value;
    
    let userId = state || cookieUserId;

    if (userId === 'undefined' || userId === 'null' || !userId) {
        userId = undefined;
    }

    logger.info('🔍 Resolving user session', {
      passedState: state,
      cookieUserId: cookieUserId ? `${cookieUserId.substring(0, 8)}...` : 'missing',
      finalUserId: userId ? `${userId.substring(0, 8)}...` : 'NOT FOUND'
    });

    if (state && state !== cookieUserId) {
        logger.info('✅ Using userId from state parameter', { userId });
    }

    if (!userId) {
      logger.warn('🍪 No cookie or state – attempting GitHub account lookup fallback');

      // Use App-level auth to get installation details (who installed it)
      try {
        const appAuth = createAppAuth({
          appId: process.env.GITHUB_APP_ID!,
          privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        });
        const appTokenAuth = await appAuth({ type: 'app' });
        
        const installationResponse = await fetch(
          `https://api.github.com/app/installations/${installationId}`,
          {
            headers: {
              Authorization: `Bearer ${appTokenAuth.token}`,
              Accept: 'application/vnd.github+json',
            },
          }
        );

        if (installationResponse.ok) {
          const installationData = await installationResponse.json();
          const githubLogin = installationData.account?.login;

          logger.info('🔍 Installation account found', { githubLogin });

          if (githubLogin) {
            // Look up user by their GitHub username
            const { data: user } = await supabaseAdmin
              .from('users')
              .select('id')
              .eq('github_username', githubLogin)
              .single();

            if (user) {
              userId = user.id;
              if (userId) { // Ensure userId is defined before using it
                logger.info('✅ User resolved via GitHub username fallback', {
                  userId: userId.substring(0, 8) + '...',
                  githubLogin,
                });
              }
            }
          }
        }
      } catch (lookupError) {
        logger.error('GitHub account lookup failed', { error: String(lookupError) });
      }
    }

    if (!userId) {
      logger.error('❌ Cannot determine user – no state, no cookie AND GitHub lookup failed');
      const debugInfo = encodeURIComponent(JSON.stringify({ 
        hasState: !!state, 
        hasCookie: !!cookieUserId,
        stateVal: state ? 'present' : 'missing'
      }));
      return NextResponse.redirect(new URL(`/?error=not_authenticated&debug=${debugInfo}`, request.url));
    }

    // ─── Step 2: Fetch repos from the installation ─────────────────
    const octokit = await createInstallationClient(Number(installationId));

    const reposResponse = await octokit.request('GET /installation/repositories');
    const reposData = reposResponse.data;

    logger.info('📦 GitHub API Response', {
      total_count: reposData.total_count,
      repo_count: reposData.repositories.length,
      repo_names: reposData.repositories.map((r: any) => r.full_name),
    });

    // Get installation token for storage
    const auth: any = await octokit.auth({ type: 'installation' });
    const encryptedToken = await encryptToken(auth.token);

    // ─── Step 3: Store each repo ───────────────────────────────────
    for (const repo of reposData.repositories) {
      const repoOwner = repo.owner.login;
      const repoName = repo.name;

      logger.info(`📝 Processing repo: ${repoOwner}/${repoName}`);

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
        logger.info(`⏭️ Already exists: ${repoOwner}/${repoName}`);
        // Still try auto-deploy in background if needed
        try {
          const autoDeployService = new VercelAutoDeployService();
          autoDeployService.autoDeployRepository({
            userId,
            githubInstallationId: existing.id,
            installationId: Number(installationId),
            repoOwner,
            repoName,
          }).catch(err => logger.error('Background auto-deploy failed', { error: String(err) }));
        } catch (e) { /* ignore */ }
        continue;
      }

      // Insert new installation record
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
        logger.error(`Failed to store ${repoOwner}/${repoName}`, { error: insertError });
        continue;
      }

      logger.info(`✅ Stored: ${repoOwner}/${repoName}`);

      // Auto-deploy in background
      try {
        const autoDeployService = new VercelAutoDeployService();
        autoDeployService.autoDeployRepository({
          userId,
          githubInstallationId: installationRecord.id,
          installationId: Number(installationId),
          repoOwner,
          repoName,
        }).then((result: any) => {
          logger.info(`✅ Auto-deployed: ${repoOwner}/${repoName}`, {
            vercelProjectId: result.vercelProjectId,
          });
        }).catch((deployError: any) => {
          logger.error(`Auto-deploy failed: ${repoOwner}/${repoName}`, {
            error: String(deployError),
          });
        });
      } catch (deployError) {
        logger.error('Auto-deploy trigger error', { error: String(deployError) });
      }
    }

    // ─── Step 4: Redirect to dashboard ─────────────────────────────
    logger.info('🎉 Installation complete, redirecting to dashboard');
    
    // Build redirect response and re-set the cookie to ensure it's fresh
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    
    // If we recovered the ID from state, make sure we plant it as a cookie again
    if (userId) {
        // PRODUCTION FIX: Ensure Secure is true on Vercel/Production
        const host = request.headers.get('host') || '';
        const isProd = !host.includes('localhost');
        const secure = isProd;

        response.cookies.set('user_id', userId, {
          httpOnly: true,
          secure: secure,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        // Debug cookie (non-httpOnly) to verify if it's arriving
        response.cookies.set('user_id_check', 'present', {
          httpOnly: false,
          secure: secure,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24,
        });
    }
    
    return response;
  } catch (error) {
    logger.error('GitHub installation callback error', { error: String(error) });
    return NextResponse.redirect(new URL('/?error=installation_failed', request.url));
  }
}
