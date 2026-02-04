#!/usr/bin/env node

/**
 * Check the most recent failure records to see if AutoFix is running
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkFailureRecords() {
  console.log('🔍 Checking recent failure records...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get the 5 most recent failure records
  const { data: failures, error } = await supabase
    .from('failure_records')
    .select('id, deployment_id, status, attempt_count, current_branch, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching failure records:', error);
    return;
  }

  if (!failures || failures.length === 0) {
    console.log('⚠️  No failure records found in database');
    return;
  }

  console.log(`Found ${failures.length} recent failure record(s):\n`);
  console.log('═══════════════════════════════════════════════════════════════════════════');

  failures.forEach((f, index) => {
    const hasFixAttempt = f.attempt_count > 0;
    const icon = hasFixAttempt ? '✅' : '❌';
    
    console.log(`\n${icon} Failure Record #${index + 1}:`);
    console.log(`   ID:              ${f.id}`);
    console.log(`   Deployment ID:   ${f.deployment_id}`);
    console.log(`   Status:          ${f.status}`);
    console.log(`   Attempt Count:   ${f.attempt_count} ${hasFixAttempt ? '(AutoFix ran!)' : '(AutoFix NOT triggered!)'}`);
    console.log(`   Current Branch:  ${f.current_branch || 'None'}`);
    console.log(`   Created:         ${f.created_at}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════════════════\n');

  // Check for fix attempts on the most recent failure
  const mostRecent = failures[0];
  console.log(`📊 Checking fix_attempts for most recent failure: ${mostRecent.id}\n`);

  const { data: attempts, error: attemptsError } = await supabase
    .from('fix_attempts')
    .select('id, attempt_number, applied_branch, deployment_status, created_at')
    .eq('failure_record_id', mostRecent.id)
    .order('created_at', { ascending: false });

  if (attemptsError) {
    console.error('❌ Error fetching fix attempts:', attemptsError);
    return;
  }

  if (!attempts || attempts.length === 0) {
    console.log('⚠️  No fix attempts found for this failure record');
    console.log('   This means the AutoFix loop did NOT run for this record.\n');
  } else {
    console.log(`✅ Found ${attempts.length} fix attempt(s):\n`);
    attempts.forEach((a, i) => {
      console.log(`   Attempt ${i + 1}:`);
      console.log(`      ID:             ${a.id}`);
      console.log(`      Attempt #:      ${a.attempt_number}`);
      console.log(`      Branch:         ${a.applied_branch}`);
      console.log(`      Deploy Status:  ${a.deployment_status || 'Not deployed yet'}`);
      console.log(`      Created:        ${a.created_at}`);
      console.log('');
    });
  }

  // Summary
  const hasAnyAttempts = failures.some(f => f.attempt_count > 0);
  console.log('═══════════════════════════════════════════════════════════════════════════');
  if (hasAnyAttempts) {
    console.log('✅ RESULT: AutoFix IS working! Found fix attempts in recent failures.');
    console.log('   If you expected more, try creating a fresh deployment failure.');
  } else {
    console.log('❌ RESULT: AutoFix NOT working! No fix attempts found.');
    console.log('   The monitor is not calling the autonomous fix loop.');
  }
  console.log('═══════════════════════════════════════════════════════════════════════════\n');
}

checkFailureRecords().catch(console.error);
