import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';

async function fetchLatestFailure() {
  console.log('🔍 Fetching latest failure record from DB...');

  try {
    const { data, error } = await supabaseAdmin
      .from('failure_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      process.exit(1);
    }

    if (!data) {
      console.log('⚠️ No records found.');
      process.exit(0);
    }

    console.log('✅ Latest Record Found:');
    console.log(`🆔 ID: ${data.id}`);
    console.log(`📅 Created: ${data.created_at}`);
    console.log(`🔗 Project ID: ${data.vercel_project_id}`);
    console.log(`🚀 Deployment ID: ${data.deployment_id}`);
    console.log(`🏷️  Source: ${data.failure_source}`);
    console.log(`📊 Status: ${data.status}`);
    console.log(`🔄 Attempts: ${data.attempt_count}`);
    console.log('📝 Metadata:', JSON.stringify(data.metadata, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  }
}

fetchLatestFailure();
