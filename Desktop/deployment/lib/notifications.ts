/**
 * Simple console-based notification system (FREE alternative to Resend)
 * Logs notifications instead of sending emails
 * In production, you could replace this with webhooks, Slack, Discord, etc.
 */

import { logger } from '../utils/logger';

/**
 * Log success notification
 */
export async function sendSuccessEmail(params: {
  to: string;
  repoName: string;
  branchName: string;
  rootCause: string;
  deploymentUrl: string;
}) {
  const { to, repoName, branchName, rootCause, deploymentUrl } = params;

  const notification = {
    type: 'SUCCESS',
    to,
    subject: '✅ AutoFix Successfully Fixed Your Deployment',
    body: {
      message: 'Deployment fixed successfully!',
      repository: repoName,
      branch: branchName,
      rootCause,
      deploymentUrl,
    },
  };

  logger.info('🎉 SUCCESS NOTIFICATION', notification);
  
  // You can replace this with:
  // - Webhook to Slack/Discord
  // - Push notification
  // - Database notification record for UI display
  console.log('\n' + '='.repeat(80));
  console.log('✅ DEPLOYMENT FIXED SUCCESSFULLY');
  console.log('='.repeat(80));
  console.log(`Repository: ${repoName}`);
  console.log(`Branch: ${branchName}`);
  console.log(`Root Cause: ${rootCause}`);
  console.log(`Deployment URL: ${deploymentUrl}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Log failure notification after max retries
 */
export async function sendFailureEmail(params: {
  to: string;
  repoName: string;
  originalError: string;
  attempts: { attempt: number; rootCause: string; filesChanged: string[] }[];
}) {
  const { to, repoName, originalError, attempts } = params;

  const notification = {
    type: 'FAILURE',
    to,
    subject: '❌ AutoFix Unable to Fix Deployment After 5 Attempts',
    body: {
      message: 'Unable to fix deployment after maximum retries',
      repository: repoName,
      originalError: originalError.substring(0, 500),
      attemptCount: attempts.length,
      attempts: attempts.map(a => ({
        attempt: a.attempt,
        rootCause: a.rootCause,
        filesChanged: a.filesChanged,
      })),
    },
  };

  logger.error('❌ FAILURE NOTIFICATION', notification);
  
  // You can replace this with:
  // - Webhook to Slack/Discord with @mention
  // - PagerDuty alert
  // - Database notification record for UI display
  console.log('\n' + '='.repeat(80));
  console.log('❌ DEPLOYMENT FIX FAILED - MAX RETRIES REACHED');
  console.log('='.repeat(80));
  console.log(`Repository: ${repoName}`);
  console.log(`Attempts: ${attempts.length}`);
  console.log(`Original Error: ${originalError.substring(0, 200)}...`);
  attempts.forEach(a => {
    console.log(`\nAttempt ${a.attempt}:`);
    console.log(`  Root Cause: ${a.rootCause}`);
    console.log(`  Files Changed: ${a.filesChanged.join(', ')}`);
  });
  console.log('='.repeat(80) + '\n');
}

/**
 * Log unfixable error notification
 * For errors that cannot be fixed by code changes (env vars, infrastructure, etc.)
 */
export async function sendUnfixableErrorEmail(params: {
  to: string;
  repoName: string;
  errorCategory: string;
  errorDescription: string;
  userActionRequired: string;
  deploymentLogs: string;
}) {
  const { to, repoName, errorCategory, errorDescription, userActionRequired, deploymentLogs } = params;

  const notification = {
    type: 'UNFIXABLE_ERROR',
    to,
    subject: '⚠️ AutoFix Cannot Fix This Error - User Action Required',
    body: {
      message: 'This deployment error requires your attention',
      repository: repoName,
      errorCategory,
      errorDescription,
      userActionRequired,
      deploymentLogs,
    },
  };

  logger.warn('⚠️ UNFIXABLE ERROR NOTIFICATION', notification);
  
  console.log('\n' + '='.repeat(80));
  console.log('⚠️ DEPLOYMENT ERROR - USER ACTION REQUIRED');
  console.log('='.repeat(80));
  console.log(`Repository: ${repoName}`);
  console.log(`Error Category: ${errorCategory}`);
  console.log(`Description: ${errorDescription}`);
  console.log(`\nAction Required:`);
  console.log(`  ${userActionRequired}`);
  console.log(`\nLog Preview:`);
  console.log(`  ${deploymentLogs.substring(0, 300)}...`);
  console.log('='.repeat(80) + '\n');
}
