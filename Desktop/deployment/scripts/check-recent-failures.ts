import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabaseAdmin } from '../lib/supabase';

async function main() {
  console.log('🔍 Checking recent failure records...');

  const { data: failures, error } = await supabaseAdmin
    .from('failure_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Failed to fetch failures:', error);
    return;
  }

  if (!failures || failures.length === 0) {
    console.log('✅ No failures found in database.');
  } else {
    console.log(`⚠️ Found ${failures.length} recent failures:`);
    failures.forEach(f => {
      console.log(`- [${f.created_at}] ID: ${f.id} | Status: ${f.status} | Source: ${f.failure_source} | Attempt: ${f.attempt_count}`);
    });
  }
}

main();
