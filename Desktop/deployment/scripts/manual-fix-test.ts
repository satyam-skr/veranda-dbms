import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';
import { decryptToken } from '../lib/encryption';
import { autonomousFixLoop } from '../lib/autofix';

async function manualFixTest() {
  const failureRecordId = process.argv[2];

  if (!failureRecordId) {
    console.error('❌ Usage: npx tsx scripts/manual-fix-test.ts <failure_record_id>');
    process.exit(1);
  }

  console.log(`🚀 Manually triggering fix loop for record: ${failureRecordId}`);

  try {
    // 1. Fetch failure record
    const { data: record, error: recordError } = await supabaseAdmin
      .from('failure_records')
      .select('*, vercel_projects(*, github_installations!inner(*))')
      .eq('id', failureRecordId)
      .single();

    if (recordError || !record) {
      console.error('❌ Failure record not found:', recordError);
      process.exit(1);
    }

    const project = record.vercel_projects;
    console.log(`📂 Project: ${project.project_name}`);

    // 2. Decrypt Vercel token
    console.log('🔐 Decrypting Vercel token...');
    const vercelToken = await decryptToken(project.vercel_token);
    console.log('✅ Token decrypted');

    // 3. Call autonomousFixLoop
    console.log('🔥 Calling autonomousFixLoop...');
    await autonomousFixLoop(
      record.id,
      project,
      vercelToken,
      record.logs || ''
    );

    console.log('✨ Fix loop completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Manual fix test failed:', error);
    process.exit(1);
  }
}

manualFixTest();
