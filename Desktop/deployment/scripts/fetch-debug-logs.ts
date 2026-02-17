import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';

async function fetchDebugLogs() {
  console.log('🔍 Fetching DEBUG webhook payload from DB...');

  try {
    const { data, error } = await supabaseAdmin
      .from('failure_records')
      .select('logs, created_at')
      .eq('failure_source', 'debug_webhook')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (!data) {
      console.log('⚠️ No DEBUG records found.');
      process.exit(0);
    }

    console.log(`✅ Record found (Created: ${data.created_at})`);
    console.log('📦 RAW PAYLOAD:');
    console.log('---------------------------------------------------');
    console.log(data.logs); // Should be the raw JSON string
    console.log('---------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  }
}

fetchDebugLogs();
