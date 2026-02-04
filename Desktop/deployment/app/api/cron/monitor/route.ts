import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptToken } from '@/lib/encryption';
import { VercelClient } from '@/lib/vercel';
import { AnalysisService } from '@/services/analysis.service';
import { FixService } from '@/services/fix.service';
import { DeploymentService } from '@/services/deployment.service';
import { ErrorClassifier } from '@/services/error-classifier';
import { sendSuccessEmail, sendFailureEmail } from '@/lib/notifications';
import { logger } from '@/utils/logger';
import { isAutoFixEnabled, isAutoFixDeployment, getSkipReasonMessage } from '@/lib/autofix-config';
import { autonomousFixLoop } from '@/lib/autofix';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max (cron timeout)

/**
 * AUTONOMOUS MONITORING CRON - Runs every 60 seconds
 * This is the main orchestration loop that:
 * 1. Polls all Vercel projects
 * 2. Detects failures
 * 3. Triggers AI analysis
 * 4. Applies fixes
 * 5. Monitors deployments
 * 6. Retries up to 5 times
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const debugKey = url.searchParams.get('key');
    
    // Allow if valid Cron Secret OR if correct Debug Key provided
    const isAuthorized = 
      authHeader === `Bearer ${process.env.VERCEL_CRON_SECRET}` || 
      debugKey === 'debug_123';

    if (!isAuthorized) {
      logger.warn('Unauthorized cron attempt', { authHeader, debugKey });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('=== Autonomous monitoring started ===');

    // Check global kill switch
    if (!isAutoFixEnabled()) {
      logger.info('AutoFix is disabled via AUTOFIX_ENABLED environment variable');
      return NextResponse.json({ 
        success: true, 
        autofixDisabled: true,
        message: 'AutoFix is disabled' 
      });
    }

    // Fetch all active Vercel projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('vercel_projects')
      .select(`
        *,
        github_installations!inner (
          id,
          repo_owner,
          repo_name,
          installation_token,
          installation_id
        ),
        users!inner (
          id,
          email
        )
      `);

    if (projectsError || !projects) {
      logger.error('Failed to fetch projects', { error: projectsError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    logger.info(`Monitoring ${projects.length} projects`);

    // Process each project
    const results = [];
    for (const project of projects) {
      try {
        // Skip projects that are currently being fixed
        if (project.is_fixing) {
          logger.info('Skipping project - AutoFix in progress', { 
            projectId: project.id,
            projectName: project.project_name 
          });
          results.push({ projectId: project.id, status: 'skipped_fixing_in_progress' });
          continue;
        }

        const result = await monitorProject(project, !!debugKey);
        results.push({ projectId: project.id, ...result });
      } catch (error) {
        logger.error('Project monitoring failed', {
          projectId: project.id,
          error: String(error),
        });
        results.push({ projectId: project.id, error: String(error) });
      }
    }

    logger.info('=== Autonomous monitoring completed ===');
    return NextResponse.json({ success: true, projectsMonitored: projects.length, results });
  } catch (error) {
    logger.error('Cron error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Monitor a single Vercel project
 */
async function monitorProject(project: any, forceRunArg = false) {
  try {
    // Decrypt Vercel token
    const vercelToken = await decryptToken(project.vercel_token);
    const vercelClient = new VercelClient(vercelToken);

    // Get latest deployment
    const deployments = await vercelClient.getDeployments(project.project_id, 1);

    if (deployments.length === 0) {
      logger.info('No deployments found', { projectId: project.id });
      return { status: 'no_deployments_found' };
    }

    const latestDeployment = deployments[0];

    // Debug: log deployment structure to understand what fields are available
    logger.info('Latest deployment structure', {
      projectId: project.id,
      deploymentKeys: Object.keys(latestDeployment),
      deploymentId: latestDeployment.id,
      deploymentUid: (latestDeployment as any).uid,
      deploymentState: latestDeployment.state,
    });

    // Check if we already processed this deployment (skip validation if debug key provided)
    // We treat 'debug_123' as a force-run
    const forceRun = (project as any)._forceRun || forceRunArg; // Passed from GET handler if needed
    
    const deploymentId = latestDeployment.id || (latestDeployment as any).uid;
    if (!deploymentId) {
      logger.error('No deployment ID found!', { deployment: latestDeployment });
      return { status: 'no_deployment_id', deployment: latestDeployment };
    }
    
    if (deploymentId === project.last_checked_deployment_id && !forceRun) {
      // Already processed
      return { status: 'already_processed', deploymentId };
    }

    logger.info('Checked deployment', {
      projectId: project.id,
      deploymentId,
      state: latestDeployment.state,
    });

    // Check deployment status
    if (latestDeployment.state === 'READY') {
      // Success - mark as checked since we're done with this ID
      await updateLastChecked(project.id, deploymentId);
      return { status: 'success_deployment', deploymentId, state: 'READY' };
    }

    if (latestDeployment.state === 'BUILDING' || latestDeployment.state === 'QUEUED') {
      // Still in progress - DO NOT update last_checked_deployment_id
      // We want to check this ID again on the next run
      return { status: 'in_progress', deploymentId, state: latestDeployment.state };
    }

    if (latestDeployment.state === 'ERROR' || latestDeployment.state === 'CANCELED') {
      // FAILURE DETECTED - Check if this is an AutoFix-generated deployment
      const autofixCheck = isAutoFixDeployment(latestDeployment);
      
      if (autofixCheck.isAutoFix) {
        // This is an AutoFix deployment - skip it, but still update last_checked_deployment_id
        const skipMessage = getSkipReasonMessage(autofixCheck.reason);
        logger.info(skipMessage, {
          projectId: project.id,
          deploymentId,
          branch: latestDeployment.gitSource?.ref,
          reason: autofixCheck.reason,
        });
        
        // Update last checked to prevent re-processing
        await updateLastChecked(project.id, deploymentId);
        
        return { 
          status: 'skipped_autofix_deployment', 
          deploymentId, 
          reason: autofixCheck.reason 
        };
      }

      // User-initiated failure - Start autonomous fix process
      logger.info('🚨 Failure detected (user deployment)!', {
        projectId: project.id,
        deploymentId,
      });

      // Mark as checked so we don't handle the same failure twice (unless retrying)
      await updateLastChecked(project.id, deploymentId);

      const result = await handleFailure(project, deploymentId, vercelToken);
      return { status: 'triggered_fix', deploymentId, state: latestDeployment.state, fixResult: result };
    }
    
    return { status: 'unknown_state', state: latestDeployment.state };
  } catch (error) {
    logger.error('Monitor project error', { projectId: project.id, error: String(error) });
    throw error;
  }
}

/**
 * Handle deployment failure - orchestrate the autonomous fix process
 */
async function handleFailure(project: any, deploymentId: string, vercelToken: string) {
  try {
    // Validate deploymentId
    if (!deploymentId) {
      logger.error('deploymentId is undefined or null!', { project: project.id });
      return { success: false, stage: 'validation', error: 'deploymentId is required' };
    }
    
    const vercelClient = new VercelClient(vercelToken);

    // Fetch deployment logs
    const logs = await vercelClient.getDeploymentLogs(deploymentId, project.project_id);

    // Create failure record
    const { data: failureRecord, error: insertError } = await supabaseAdmin
      .from('failure_records')
      .insert({
        vercel_project_id: project.id,
        deployment_id: deploymentId,
        failure_source: 'vercel_build_error',
        logs,
        status: 'pending_analysis',
        attempt_count: 0,
      })
      .select()
      .single();

    if (insertError || !failureRecord) {
      logger.error('Failed to create failure record', { error: insertError });
      return { success: false, stage: 'insert_db', error: insertError };
    }

    logger.info('Created failure record', { failureRecordId: failureRecord.id });

    // Start autonomous fix loop (pass logs for unfixable error notifications)
    console.log("🔥 About to call autonomousFixLoop for failure:", failureRecord.id);
    await autonomousFixLoop(failureRecord.id, project, vercelToken, logs);
    
    return { success: true, failureRecordId: failureRecord.id };
  } catch (error) {
    logger.error('Handle failure error', { error: String(error) });
    return { success: false, stage: 'handle_failure_catch', error: String(error) };
  }
}

async function updateLastChecked(projectId: string, deploymentId: string) {
  await supabaseAdmin
    .from('vercel_projects')
    .update({
      last_checked_deployment_id: deploymentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);
}
