import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/logger';

/**
 * DELETE /api/repos - Remove all repositories for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      console.log('[DeleteRepos] Cookies received:', request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('[DeleteRepos] Starting bulk deletion for user', { userId });

    // 1. Get all installations for this user
    const { data: installations, error: fetchError } = await supabaseAdmin
      .from('github_installations')
      .select('id')
      .eq('user_id', userId);

    if (fetchError) {
      logger.error('[DeleteRepos] Failed to fetch installations', { error: fetchError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!installations || installations.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No repositories to delete',
        deleted: 0 
      });
    }

    const installationIds = installations.map(i => i.id);
    logger.info('[DeleteRepos] Found installations', { count: installations.length });

    // 2. Get all Vercel projects for these installations
    const { data: projects } = await supabaseAdmin
      .from('vercel_projects')
      .select('id')
      .in('github_installation_id', installationIds);

    let deletedProjects = 0;
    let deletedFailures = 0;

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);

      // Delete failure records first (foreign key constraint)
      const { error: failureError } = await supabaseAdmin
        .from('failure_records')
        .delete()
        .in('vercel_project_id', projectIds);

      if (failureError) {
        logger.error('[DeleteRepos] Failed to delete failure records', { error: failureError });
      } else {
        logger.info('[DeleteRepos] Deleted failure records for projects');
        deletedFailures = projectIds.length; // Approximate
      }

      // Delete Vercel projects
      const { error: projectError } = await supabaseAdmin
        .from('vercel_projects')
        .delete()
        .in('id', projectIds);

      if (projectError) {
        logger.error('[DeleteRepos] Failed to delete Vercel projects', { error: projectError });
        return NextResponse.json({ error: 'Failed to delete projects' }, { status: 500 });
      }

      deletedProjects = projects.length;
      logger.info('[DeleteRepos] Deleted Vercel projects', { count: deletedProjects });
    }

    // 3. Delete GitHub installations
    const { error: installError } = await supabaseAdmin
      .from('github_installations')
      .delete()
      .in('id', installationIds);

    if (installError) {
      logger.error('[DeleteRepos] Failed to delete installations', { error: installError });
      return NextResponse.json({ error: 'Failed to delete installations' }, { status: 500 });
    }

    const deletedRepos = installations.length;
    logger.info('[DeleteRepos] Successfully deleted all repos', { 
      repos: deletedRepos,
      projects: deletedProjects,
      failures: deletedFailures,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${deletedRepos} repository${deletedRepos !== 1 ? 'ies' : ''}`,
      deleted: {
        repos: deletedRepos,
        projects: deletedProjects,
        failures: deletedFailures,
      }
    });

  } catch (error) {
    logger.error('[DeleteRepos] Bulk deletion failed', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookie
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's repos with Vercel projects
    const { data: installations, error } = await supabaseAdmin
      .from('github_installations')
      .select(`
        *,
        vercel_projects (*)
      `)
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch repos', { error });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ repos: installations || [] });
  } catch (error) {
    logger.error('Repos API error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
