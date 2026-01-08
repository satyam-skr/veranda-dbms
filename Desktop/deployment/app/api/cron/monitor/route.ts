import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptToken } from '@/lib/encryption';
import { VercelClient } from '@/lib/vercel';
import { AnalysisService } from '@/services/analysis.service';
import { FixService } from '@/services/fix.service';
import { DeploymentService } from '@/services/deployment.service';
import { sendSuccessEmail, sendFailureEmail } from '@/lib/notifications';
import { logger } from '@/utils/logger';

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
    if (authHeader !== `Bearer ${process.env.VERCEL_CRON_SECRET}`) {
      logger.warn('Unauthorized cron attempt', { authHeader });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('=== Autonomous monitoring started ===');

    // Fetch all active Vercel projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('vercel_projects')
      .select(`
        *,
        github_installations (*),
        users (*)
      `);

    if (projectsError || !projects) {
      logger.error('Failed to fetch projects', { error: projectsError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    logger.info(`Monitoring ${projects.length} projects`);

    // Process each project
    for (const project of projects) {
      try {
        await monitorProject(project);
      } catch (error) {
        logger.error('Project monitoring failed', {
          projectId: project.id,
          error: String(error),
        });
        // Continue with other projects
      }
    }

    logger.info('=== Autonomous monitoring completed ===');
    return NextResponse.json({ success: true, projectsMonitored: projects.length });
  } catch (error) {
    logger.error('Cron error', { error: String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Monitor a single Vercel project
 */
async function monitorProject(project: any) {
  try {
    // Decrypt Vercel token
    const vercelToken = await decryptToken(project.vercel_token);
    const vercelClient = new VercelClient(vercelToken);

    // Get latest deployment
    const deployments = await vercelClient.getDeployments(project.project_id, 1);

    if (deployments.length === 0) {
      logger.info('No deployments found', { projectId: project.id });
      return;
    }

    const latestDeployment = deployments[0];

    // Check if we already processed this deployment
    if (latestDeployment.id === project.last_checked_deployment_id) {
      // Already processed
      return;
    }

    // Update last checked deployment
    await supabaseAdmin
      .from('vercel_projects')
      .update({
        last_checked_deployment_id: latestDeployment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    logger.info('Checked deployment', {
      projectId: project.id,
      deploymentId: latestDeployment.id,
      state: latestDeployment.state,
    });

    // Check deployment status
    if (latestDeployment.state === 'READY') {
      // Success - nothing to do
      return;
    }

    if (latestDeployment.state === 'BUILDING' || latestDeployment.state === 'QUEUED') {
      // Still in progress
      return;
    }

    if (latestDeployment.state === 'ERROR' || latestDeployment.state === 'CANCELED') {
      // FAILURE DETECTED - Start autonomous fix process
      logger.info('🚨 Failure detected!', {
        projectId: project.id,
        deploymentId: latestDeployment.id,
      });

      await handleFailure(project, latestDeployment.id, vercelToken);
    }
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
    const vercelClient = new VercelClient(vercelToken);

    // Fetch deployment logs
    const logs = await vercelClient.getDeploymentLogs(deploymentId);

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
      return;
    }

    logger.info('Created failure record', { failureRecordId: failureRecord.id });

    // Start autonomous fix loop
    await autonomousFixLoop(failureRecord.id, project, vercelToken);
  } catch (error) {
    logger.error('Handle failure error', { error: String(error) });
  }
}

/**
 * AUTONOMOUS FIX LOOP - Phases 3-7
 * Continuously try to fix deployment up to 5 times
 */
async function autonomousFixLoop(failureRecordId: string, project: any, vercelToken: string) {
  const MAX_RETRIES = 5;
  let currentFailureId = failureRecordId;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`🤖 Starting autonomous fix attempt ${attempt}/${MAX_RETRIES}`, {
        failureRecordId: currentFailureId,
      });

      // PHASE 3: AI Analysis
      const analysisService = new AnalysisService();
      const aiResponse = await analysisService.analyzeFailureAndGenerateFix(currentFailureId);

      if (!aiResponse) {
        logger.error('AI analysis failed', { failureRecordId: currentFailureId });
        await markAsFailed(currentFailureId, project.users.email, attempt);
        return;
      }

      logger.info('✅ AI analysis complete', {
        rootCause: aiResponse.rootCause,
        filesCount: aiResponse.filesToChange.length,
      });

      // PHASE 4: Apply Fix
      const fixService = new FixService();
      const fixResult = await fixService.applyFixAndCommit(
        currentFailureId,
        aiResponse,
        'AI analysis prompt' // You can store the actual prompt if needed
      );

      if (!fixResult) {
        logger.error('Fix application failed', { failureRecordId: currentFailureId });
        await markAsFailed(currentFailureId, project.users.email, attempt);
        return;
      }

      logger.info('✅ Fix applied to GitHub', { branch: fixResult.branchName });

      // PHASE 5: Trigger Deployment
      const deploymentService = new DeploymentService();
      const newDeploymentId = await deploymentService.triggerDeployment(
        project.id,
        fixResult.branchName,
        fixResult.fixAttemptId
      );

      if (!newDeploymentId) {
        logger.error('Deployment trigger failed', { failureRecordId: currentFailureId });
        await markAsFailed(currentFailureId, project.users.email, attempt);
        return;
      }

      logger.info('✅ Deployment triggered', { deploymentId: newDeploymentId });

      // PHASE 6: Poll Deployment Status
      const pollResult = await deploymentService.pollDeploymentStatus(
        newDeploymentId,
        vercelToken,
        fixResult.fixAttemptId
      );

      // PHASE 7: Decision Loop
      if (pollResult.status === 'success') {
        // 🎉 SUCCESS!
        logger.info('🎉 Deployment fixed successfully!', {
          failureRecordId: currentFailureId,
          attempt,
        });

        // Update failure record
        await supabaseAdmin
          .from('failure_records')
          .update({ status: 'fixed_successfully', updated_at: new Date().toISOString() })
          .eq('id', currentFailureId);

        // Send success notification
        const deployment = await new VercelClient(vercelToken).getDeployment(newDeploymentId);
        await sendSuccessEmail({
          to: project.users.email,
          repoName: `${project.github_installations.repo_owner}/${project.github_installations.repo_name}`,
          branchName: fixResult.branchName,
          rootCause: aiResponse.rootCause,
          deploymentUrl: deployment.url,
        });

        return; // Job done!
      } else if (pollResult.status === 'failed' && attempt < MAX_RETRIES) {
        // Failed but we have retries left - create new failure record and retry
        logger.info('⚠️ Fix did not work, retrying...', { attempt, retriesLeft: MAX_RETRIES - attempt });

        const { data: newFailure } = await supabaseAdmin
          .from('failure_records')
          .insert({
            vercel_project_id: project.id,
            deployment_id: newDeploymentId,
            failure_source: 'retry_after_fix_attempt',
            logs: pollResult.logs || '',
            status: 'pending_analysis',
            attempt_count: attempt,
          })
          .select()
          .single();

        if (newFailure) {
          currentFailureId = newFailure.id;
          // Continue to next iteration
        } else {
          logger.error('Failed to create retry failure record');
          await markAsFailed(currentFailureId, project.users.email, attempt);
          return;
        }
      } else {
        // Failed and no retries left
        logger.error('❌ Max retries exhausted', { attempt });
        await markAsFailed(currentFailureId, project.users.email, attempt, aiResponse);
        return;
      }
    } catch (error) {
      logger.error('Autonomous fix loop error', { attempt, error: String(error) });
      await markAsFailed(currentFailureId, project.users.email, attempt);
      return;
    }
  }
}

/**
 * Mark failure as failed after max retries
 */
async function markAsFailed(
  failureRecordId: string,
  userEmail: string,
  attempts: number,
  lastAiResponse?: any
) {
  // Update failure record
  await supabaseAdmin
    .from('failure_records')
    .update({
      status: 'failed_after_max_retries',
      updated_at: new Date().toISOString(),
    })
    .eq('id', failureRecordId);

  // Fetch all fix attempts for this failure
  const { data: fixAttempts } = await supabaseAdmin
    .from('fix_attempts')
    .select('*')
    .eq('failure_record_id', failureRecordId)
    .order('attempt_number', { ascending: true });

  const { data: failureRecord } = await supabaseAdmin
    .from('failure_records')
    .select('*, vercel_projects(*, github_installations(*))')
    .eq('id', failureRecordId)
    .single();

  if (failureRecord && fixAttempts) {
    const installation = failureRecord.vercel_projects.github_installations;
    
    // Send failure notification
    await sendFailureEmail({
      to: userEmail,
      repoName: `${installation.repo_owner}/${installation.repo_name}`,
      originalError: failureRecord.logs.substring(0, 1000),
      attempts: fixAttempts.map((fa: any) => ({
        attempt: fa.attempt_number,
        rootCause: fa.ai_response?.rootCause || 'Unknown',
        filesChanged: fa.files_changed?.map((f: any) => f.filename) || [],
      })),
    });
  }
}
