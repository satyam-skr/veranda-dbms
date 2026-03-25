'use server';

import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/logger';

/**
 * Server Action: Delete all repositories for the current user.
 * 
 * This runs SERVER-SIDE so it reads cookies via next/headers,
 * bypassing any browser cookie-sending issues that caused 401 errors
 * when using client-side fetch.
 */
export async function deleteAllRepos(): Promise<{
  success: boolean;
  message: string;
  deleted?: { repos: number; projects: number; failures: number };
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (!userId) {
      return { success: false, message: 'Unauthorized', error: 'No user_id cookie found' };
    }

    logger.info('[DeleteRepos] Starting bulk deletion for user', { userId });

    // 1. Get all installations for this user
    const { data: installations, error: fetchError } = await supabaseAdmin
      .from('github_installations')
      .select('id')
      .eq('user_id', userId);

    if (fetchError) {
      logger.error('[DeleteRepos] Failed to fetch installations', { error: fetchError });
      return { success: false, message: 'Database error', error: String(fetchError) };
    }

    if (!installations || installations.length === 0) {
      return { success: true, message: 'No repositories to delete', deleted: { repos: 0, projects: 0, failures: 0 } };
    }

    const installationIds = installations.map(i => i.id);

    // 2. Get Vercel projects for these installations
    const { data: projects } = await supabaseAdmin
      .from('vercel_projects')
      .select('id')
      .in('github_installation_id', installationIds);

    let deletedProjects = 0;
    let deletedFailures = 0;

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);

      // Delete failure records (foreign key)
      const { error: failureError } = await supabaseAdmin
        .from('failure_records')
        .delete()
        .in('vercel_project_id', projectIds);

      if (failureError) {
        logger.error('[DeleteRepos] Failed to delete failure records', { error: failureError });
      } else {
        deletedFailures = projectIds.length;
      }

      // Delete Vercel projects
      const { error: projectError } = await supabaseAdmin
        .from('vercel_projects')
        .delete()
        .in('id', projectIds);

      if (projectError) {
        logger.error('[DeleteRepos] Failed to delete Vercel projects', { error: projectError });
        return { success: false, message: 'Failed to delete projects', error: String(projectError) };
      }

      deletedProjects = projects.length;
    }

    // 3. Delete GitHub installations
    const { error: installError } = await supabaseAdmin
      .from('github_installations')
      .delete()
      .in('id', installationIds);

    if (installError) {
      logger.error('[DeleteRepos] Failed to delete installations', { error: installError });
      return { success: false, message: 'Failed to delete installations', error: String(installError) };
    }

    const deletedRepos = installations.length;
    logger.info('[DeleteRepos] Successfully deleted all repos', {
      repos: deletedRepos,
      projects: deletedProjects,
      failures: deletedFailures,
    });

    return {
      success: true,
      message: `Successfully removed ${deletedRepos} repository${deletedRepos !== 1 ? 'ies' : ''}`,
      deleted: { repos: deletedRepos, projects: deletedProjects, failures: deletedFailures },
    };
  } catch (error) {
    logger.error('[DeleteRepos] Bulk deletion failed', { error: String(error) });
    return { success: false, message: 'Internal error', error: String(error) };
  }
}
