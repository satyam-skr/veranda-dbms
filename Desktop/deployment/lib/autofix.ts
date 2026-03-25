import { supabaseAdmin } from '@/lib/supabase';
import { VercelClient } from '@/lib/vercel';
import { AnalysisService } from '@/services/analysis.service';
import { FixService } from '@/services/fix.service';
import { DeploymentService } from '@/services/deployment.service';
import {
  sendSuccessEmail,
  sendFailureEmail,
  sendUnfixableErrorEmail,
} from '@/lib/notifications';
import { logger } from '@/utils/logger';
import { isAutoFixEnabled } from '@/lib/autofix-config';

import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

const MAX_RETRIES = 5;

/* ============================================================
   DEBUG LOGGER
============================================================ */
function logToDebugFile(message: string) {
  try {
    const logPath = path.join(process.cwd(), 'autofix-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch {
    // ignore
  }
}

/* ============================================================
   🔑 ERROR SIGNATURE EXTRACTION (CRITICAL)
============================================================ */
function extractErrorSignature(logs: string): string {
  if (!logs) return 'UNKNOWN';

  const patterns = [
    /Cannot find module ['"](.*)['"]/i,
    /Module not found:.*['"](.*)['"]/i,
    /does not provide an export named ['"](.*)['"]/i,
    /export '(.+)' was not found/i,
    /Unexpected token/i,
    /SyntaxError/i,
    /ReferenceError: (.+)/i,
    /TypeError: (.+)/i,
  ];

  for (const pattern of patterns) {
    const match = logs.match(pattern);
    if (match) {
      return `${pattern.source}:${match[1] || 'unknown'}`;
    }
  }

  const firstErrorLine = logs
    .split('\n')
    .find(l => l.toLowerCase().includes('error'));

  return firstErrorLine
    ? `GENERIC:${firstErrorLine.slice(0, 120)}`
    : 'UNKNOWN';
}

/* ============================================================
   AUTONOMOUS FIX LOOP
============================================================ */
export async function autonomousFixLoop(
  failureRecordId: string,
  project: any,
  vercelToken: string,
  deploymentLogs: string
) {
  console.log('\n' + '🔧'.repeat(40));
  console.log('🔧 [AutoFix] ENTRY POINT HIT');
  console.log(`🔧 Failure Record ID: ${failureRecordId}`);
  console.log(`🔧 Project: ${project.project_name}`);
  console.log('🔧'.repeat(40));

  // Throttling: Wait 5s before starting to clear Token Bucket (Gemini Free Tier)
  console.log('⏳ [AutoFix] Waiting 5s for API Token Bucket reset...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  let currentFailureId = failureRecordId;
  let lockAcquired = false;

  if (!isAutoFixEnabled()) {
    logger.info('[AutoFix] Disabled via AUTOFIX_ENABLED');
    return;
  }

  try {
    /* --------------------------------------------------------
       ACQUIRE LOCK
    -------------------------------------------------------- */
    const { data: lock } = await supabaseAdmin
      .from('vercel_projects')
      .update({ is_fixing: true })
      .eq('id', project.id)
      .eq('is_fixing', false)
      .select('id')
      .single();

    if (!lock) {
      logger.warn('[AutoFix] Project already locked');
      return;
    }

    lockAcquired = true;
    logger.info('🔒 [AutoFix] Project lock acquired', { projectId: project.id });

    /* --------------------------------------------------------
       ENV VALIDATION
    -------------------------------------------------------- */
    if (!project.github_installations?.installation_token || !vercelToken) {
      await markAsUnfixable(
        currentFailureId,
        project.users?.email,
        'Missing GitHub or Vercel token'
      );
      return;
    }

    /* --------------------------------------------------------
       MAIN LOOP WITH FAILURE TRACKING
    -------------------------------------------------------- */
    const failureReasons: string[] = [];
    let lastValidationResult: any = null;
    let resolved = false;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      logger.info(`▶️ [AutoFix] Attempt ${attempt}/${MAX_RETRIES}`);

      const errorSignature = extractErrorSignature(deploymentLogs);

      const { data: previous } = await supabaseAdmin
        .from('failure_records')
        .select('error_signature')
        .eq('id', currentFailureId)
        .single();

      if (previous?.error_signature === errorSignature && attempt > 1) {
        logger.warn(
          '🛑 [AutoFix] Same error signature repeated — stopping retries',
          { errorSignature }
        );
        failureReasons.push('repeated_error_signature');

        await markAsFailed(
          currentFailureId,
          project.users.email,
          attempt,
          failureReasons
        );
        return;
      }

      try {
      await supabaseAdmin
        .from('failure_records')
        .update({ 
          error_signature: errorSignature,
          status: 'analyzing'
        })
        .eq('id', currentFailureId);

      /* ----------------------------------------------------
         PHASE 3: AI ANALYSIS (LOG-FIRST)
      ---------------------------------------------------- */
      const analysisService = new AnalysisService();
      const aiResponse =
        await analysisService.analyzeFailureAndGenerateFix(
          currentFailureId
        );

      if (!aiResponse) {
        const reason = 'ai_analysis_failed';
        failureReasons.push(reason);
        logger.warn(`[AutoFix] Retry ${attempt}/${MAX_RETRIES} — reason: ${reason}`);
        
        // Update status so UI doesn't show stuck 'analyzing'
        await supabaseAdmin
          .from('failure_records')
          .update({ status: 'pending_analysis' })
          .eq('id', currentFailureId);
        
        // Early exit if same failure repeats 3 times
        const lastThree = failureReasons.slice(-3);
        if (lastThree.length === 3 && lastThree.every(r => r === lastThree[0])) {
          logger.warn(`[AutoFix] Same failure (${lastThree[0]}) repeated 3x — aborting early`, {
            failureReasons,
          });
          await markAsFailed(currentFailureId, project.users.email, attempt, failureReasons);
          return;
        }
        
        continue;
      }

      // HARD SAFETY: never allow empty code
      aiResponse.filesToChange = aiResponse.filesToChange.filter(
        f => f.newCode && f.newCode.trim().length > 0
      );

      if (aiResponse.filesToChange.length === 0) {
        const reason = 'empty_fixes_filtered';
        failureReasons.push(reason);
        logger.warn(`[AutoFix] Retry ${attempt}/${MAX_RETRIES} — reason: ${reason}`);
        
        // Update status so UI doesn't show stuck 'analyzing'
        await supabaseAdmin
          .from('failure_records')
          .update({ status: 'pending_analysis' })
          .eq('id', currentFailureId);
        
        continue;
      }

      // 🧪 SAFEGUARD #3: FLIP-FLOP DETECTION
      const combinedCodes = aiResponse.filesToChange.map((f: any) => f.newCode).join('|||');
      const fixHash = crypto
        .createHash('sha256')
        .update(combinedCodes)
        .digest('hex')
        .substring(0, 16);

      const { data: currentRecord } = await supabaseAdmin
        .from('failure_records')
        .select('metadata')
        .eq('id', currentFailureId)
        .single();
      
      const metadata = currentRecord?.metadata || {};
      const attemptedFixHashes = metadata.attempted_fix_hashes || [];

      if (attemptedFixHashes.includes(fixHash)) {
        logger.error('❌ [AutoFix] FLIP-FLOP DETECTED - AI suggested same fix twice', {
          fixHash,
          previousAttempts: attemptedFixHashes.length,
          failureRecordId: currentFailureId
        });
        
        failureReasons.push('flip_flop_detected');
        await markAsFailed(currentFailureId, project.users.email, attempt, failureReasons);
        return;
      }

      // Store this hash
      const newAttemptedHashes = [...attemptedFixHashes, fixHash];
      await supabaseAdmin
        .from('failure_records')
        .update({ 
          metadata: { ...metadata, attempted_fix_hashes: newAttemptedHashes } 
        })
        .eq('id', currentFailureId);

      logger.info('✅ [AutoFix] Fix hash verified', { fixHash });

      /* ----------------------------------------------------
         PHASE 4: APPLY FIX
      ---------------------------------------------------- */
      const fixService = new FixService();
      const fixResult = await fixService.applyFixAndCommit(
        currentFailureId,
        aiResponse,
        'vercel-log-driven-fix'
      );

      if (!fixResult) {
        const reason = 'fix_apply_failed';
        failureReasons.push(reason);
        logger.warn(`[AutoFix] Retry ${attempt}/${MAX_RETRIES} — reason: ${reason}`);
        
        // Early exit check
        const lastThree = failureReasons.slice(-3);
        if (lastThree.length === 3 && lastThree.every(r => r === lastThree[0])) {
          logger.warn(`[AutoFix] Same failure (${lastThree[0]}) repeated 3x — aborting early`);
          await markAsFailed(currentFailureId, project.users.email, attempt, failureReasons);
          return;
        }
        
        continue;
      }

      /* ----------------------------------------------------
         PHASE 5: DEPLOY
      ---------------------------------------------------- */
      console.log('🚀 [Fix] Triggering Vercel deployment...');
      const deploymentService = new DeploymentService();
      const deploymentId =
        await deploymentService.triggerDeployment(
          project.id,
          fixResult.branchName,
          fixResult.fixAttemptId
        );

      if (!deploymentId) {
        console.error('❌ [Fix] Deployment trigger FAILED');
        const reason = 'deployment_trigger_failed';
        failureReasons.push(reason);
        logger.warn(`[AutoFix] Retry ${attempt}/${MAX_RETRIES} — reason: ${reason}`);
        continue;
      }
      
      console.log(`✅ [Fix] Deployment triggered: ${deploymentId}`);

      /* ----------------------------------------------------
         PHASE 6: POLL
      ---------------------------------------------------- */
      console.log('📡 [AutoFix] Polling deployment status...');
      const pollResult =
        await deploymentService.pollDeploymentStatus(
          deploymentId,
          vercelToken,
          fixResult.fixAttemptId
        );

      console.log(`📊 [AutoFix] Polling completed: ${pollResult.status}`);

      if (pollResult.status === 'success') {
        await supabaseAdmin
          .from('failure_records')
          .update({ status: 'fixed_successfully' })
          .eq('id', currentFailureId);

        const deployment = await new VercelClient(
          vercelToken
        ).getDeployment(deploymentId);

        await sendSuccessEmail({
          to: project.users.email,
          repoName: `${project.github_installations.repo_owner}/${project.github_installations.repo_name}`,
          branchName: fixResult.branchName,
          rootCause: aiResponse.rootCause,
          deploymentUrl: deployment.url,
        });

        resolved = true;
        return;
      }

      /* ----------------------------------------------------
         PREPARE NEXT ATTEMPT
      ---------------------------------------------------- */
      deploymentLogs = pollResult.logs || deploymentLogs;

      const { data: newFailure } = await supabaseAdmin
        .from('failure_records')
        .insert({
          vercel_project_id: project.id,
          deployment_id: deploymentId,
          logs: deploymentLogs,
          status: 'pending_analysis',
          attempt_count: attempt,
          failure_source: 'retry_after_fix',
        })
        .select()
        .single();

      if (!newFailure) {
        failureReasons.push('failed_to_create_retry_record');
        await markAsFailed(currentFailureId, project.users.email, attempt, failureReasons);
        return;
      }

      currentFailureId = newFailure.id;
      } catch (attemptError) {
        // Catch any uncaught error in the retry body so status doesn't stay stuck
        logger.error(`[AutoFix] Attempt ${attempt} crashed`, {
          error: String(attemptError),
          stack: attemptError instanceof Error ? attemptError.stack : undefined,
        });
        failureReasons.push('attempt_crashed');
        
        // Reset status from 'analyzing' so UI doesn't show stuck
        await supabaseAdmin
          .from('failure_records')
          .update({ status: 'pending_analysis' })
          .eq('id', currentFailureId);
        
        continue;
      }
    }

    // 🚨 CRITICAL: If we reach here, max retries exhausted without success
    if (!resolved) {
      logger.error('[AutoFix] ❌ Max retries exceeded without resolution', {
        failureReasons,
        totalAttempts: MAX_RETRIES,
      });
      await markAsFailed(currentFailureId, project.users.email, MAX_RETRIES, failureReasons);
    }
  } finally {
    if (lockAcquired) {
      await supabaseAdmin
        .from('vercel_projects')
        .update({ is_fixing: false })
        .eq('id', project.id);

      logger.info('🔓 [AutoFix] Project lock released');
    }
  }
}

/* ============================================================
   FAILURE HANDLERS
============================================================ */
async function markAsUnfixable(
  failureRecordId: string,
  email: string,
  reason: string
) {
  await supabaseAdmin
    .from('failure_records')
    .update({ status: 'failed_unfixable' })
    .eq('id', failureRecordId);

  if (email) {
    await sendUnfixableErrorEmail({
      to: email,
      repoName: 'Unknown',
      errorCategory: 'Environment',
      errorDescription: reason,
      userActionRequired: reason,
      deploymentLogs: '',
    });
  }
}

async function markAsFailed(
  failureRecordId: string,
  email: string,
  attempts: number,
  failureReasons: string[] = []
) {
  logger.error('[AutoFix] Marking as failed', {
    failureRecordId,
    attempts,
    failureReasons,
  });

  await supabaseAdmin
    .from('failure_records')
    .update({ 
      status: 'failed_after_max_retries',
      // Store failure breakdown for debugging
      metadata: {
        failure_reasons: failureReasons,
        total_attempts: attempts,
        failed_at: new Date().toISOString(),
      }
    })
    .eq('id', failureRecordId);

  if (email) {
    await sendFailureEmail({
      to: email,
      repoName: 'Unknown',
      originalError: `AutoFix exhausted ${attempts} retries. Failure breakdown: ${failureReasons.join(', ')}`,
      attempts: [],
    });
  }
}
