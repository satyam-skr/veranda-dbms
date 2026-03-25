import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { decryptToken } from '@/lib/encryption';
import { isAutoFixEnabled } from '@/lib/autofix-config';
import { VercelClient } from '@/lib/vercel';

export async function POST(request: NextRequest) {
  try {
    // Check global kill switch
    if (!isAutoFixEnabled()) {
      return NextResponse.json({ 
        error: 'AutoFix is disabled', 
        autofixDisabled: true 
      }, { status: 403 });
    }

    const { failureId } = await request.json();

    if (!failureId) {
      return NextResponse.json({ error: 'failureId is required' }, { status: 400 });
    }

    // 1. Fetch original failure record
    const { data: originalFailure, error: fetchError } = await supabaseAdmin
      .from('failure_records')
      .select('*, vercel_projects(*, github_installations(*), users(*))')
      .eq('id', failureId)
      .single();

    if (fetchError || !originalFailure) {
      return NextResponse.json({ error: 'Failure record not found' }, { status: 404 });
    }

    const project = originalFailure.vercel_projects;

    // Check if project is currently being fixed
    if (project.is_fixing) {
      return NextResponse.json({ 
        error: 'AutoFix is already in progress for this project',
        alreadyFixing: true 
      }, { status: 409 });
    }

    // 2. RE-FETCH FRESH LOGS (Critical: don't reuse stale logs)
    const vercelToken = await decryptToken(project.vercel_token);
    const vercelClient = new VercelClient(vercelToken);
    
    let freshLogs = originalFailure.logs;
    
    if (originalFailure.deployment_id) {
      try {
        freshLogs = await vercelClient.getDeploymentLogs(
          originalFailure.deployment_id,
          project.project_id
        );
        logger.info('[ManualRetry] Fetched fresh logs', { 
          deploymentId: originalFailure.deployment_id,
          freshLogLength: freshLogs.length,
          originalLogLength: originalFailure.logs.length,
        });
      } catch (logError) {
        logger.warn('[ManualRetry] Failed to fetch fresh logs, using cached', { 
          error: String(logError) 
        });
      }
    }

    // 3. LOG STATUS (but don't block anymore)
    const logsChanged = freshLogs.trim() !== originalFailure.logs.trim();
    
    if (!logsChanged) {
      logger.info('[ManualRetry] Logs unchanged — proceeding anyway', {
        failureId,
        deploymentId: originalFailure.deployment_id,
      });
    }

    // 4. Update failure record with fresh logs and reset state
    const { error: updateError } = await supabaseAdmin
      .from('failure_records')
      .update({
        attempt_count: 0,
        status: 'pending_analysis',
        is_manual_retry: true,
        logs: freshLogs, // Use FRESH logs
        updated_at: new Date().toISOString(),
      })
      .eq('id', failureId);

    if (updateError) {
      logger.error('Failed to update failure record for retry', { error: updateError });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    logger.info('[ManualRetry] Initiated with fresh context', { 
      failureId,
      projectId: project.id,
      logsChanged: true,
    });

    // 5. Trigger AutoFix Loop in background with FRESH logs
    const { autonomousFixLoop } = await import('@/lib/autofix');

    // Run the loop (fire and forget)
    autonomousFixLoop(failureId, project, vercelToken, freshLogs).catch(err => {
        logger.error('Manual retry loop failed', err);
    });

    return NextResponse.json({ 
      success: true, 
      failureId,
      message: 'Manual retry started with fresh deployment logs'
    });

  } catch (error) {
    logger.error('Manual retry error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
