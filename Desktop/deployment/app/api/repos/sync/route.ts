import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptToken, encryptToken } from '@/lib/encryption';
import { createTokenClient } from '@/lib/github';
import { logger } from '@/utils/logger';
import { createAppAuth } from '@octokit/auth-app';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('🔄 Starting manual repo sync', { userId });

    // 1. Fetch user to get OAuth token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('Failed to fetch user', { error: userError });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.github_access_token) {
      logger.error('User has no GitHub access token', { userId });
      return NextResponse.json({ error: 'GitHub account not linked' }, { status: 400 });
    }

    // 2. Decrypt OAuth token
    let accessToken: string;
    try {
      accessToken = await decryptToken(user.github_access_token);
    } catch (err) {
      logger.error('Token decryption failed', { error: String(err) });
      return NextResponse.json({ error: 'Session expired, please log in again' }, { status: 401 });
    }

    const octokit = createTokenClient(accessToken);

    // 3. List all installations for this user
    const { data: installations } = await octokit.apps.listInstallationsForAuthenticatedUser();
    
    logger.info(`Found ${installations.installations.length} installations for user`);

    let totalSynced = 0;
    let errors = [];

    // 4. Process each installation
    for (const installation of installations.installations) {
      try {
        // Get repos for this installation
        const { data: reposData } = await octokit.apps.listInstallationReposForAuthenticatedUser({
          installation_id: installation.id,
        });

        logger.info(`Syncing ${reposData.repositories.length} repos for installation ${installation.id}`);

        // Get an installation token for our app to use locally
        const auth = await createAppAuth({
          appId: process.env.GITHUB_APP_ID!,
          privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        })({
          type: 'installation',
          installationId: installation.id,
        });

        const encryptedToken = await encryptToken(auth.token);

        // Upsert each repo
        for (const repo of reposData.repositories) {
          const { error: upsertError } = await supabaseAdmin
            .from('github_installations')
            .upsert({
              user_id: userId,
              installation_id: installation.id,
              repo_owner: repo.owner.login,
              repo_name: repo.name,
              installation_token: encryptedToken,
              token_expires_at: auth.expiresAt,
            }, {
              onConflict: 'user_id, installation_id, repo_owner, repo_name'
            });

          if (upsertError) {
            logger.error(`Failed to upsert repo ${repo.full_name}`, { error: upsertError });
            errors.push(`${repo.full_name}: ${upsertError.message}`);
          } else {
            totalSynced++;
          }
        }
      } catch (instErr) {
        logger.error(`Error syncing installation ${installation.id}`, { error: String(instErr) });
        errors.push(`Inst ${installation.id}: ${String(instErr)}`);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: totalSynced,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    logger.error('Sync API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
