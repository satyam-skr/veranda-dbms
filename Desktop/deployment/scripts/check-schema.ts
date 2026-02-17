import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';

async function checkSchema() {
  console.log('🔍 Checking failure_records schema...');

  try {
    // We can't easily get the schema definition via the JS client standard query builder
    // but we can try to insert a record with NULL vercel_project_id and see the specific error
    // or success. This is a practical test.
    
    console.log('🧪 Attempting test insert with NULL project_id...');
    const { data, error } = await supabaseAdmin
      .from('failure_records')
      .insert({
        vercel_project_id: null,
        deployment_id: 'SCHEMA_TEST_' + Date.now(),
        failure_source: 'schema_check',
        logs: 'schema test',
        status: 'pending_analysis',
        attempt_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed:', error);
      if (error.message.includes('null value in column "vercel_project_id" violates not-null constraint')) {
        console.log('🔒 CONCLUSION: Column vercel_project_id is NOT NULLABLE');
      } else {
        console.log('❓ CONCLUSION: Insert failed for another reason (maybe FK constraint was not hit because it is null? No, if it is null invalid, it errors on Not Null)');
      }
    } else {
      console.log('✅ Insert successful!');
      console.log('🔓 CONCLUSION: Column vercel_project_id IS NULLABLE');
      
      // Cleanup
      await supabaseAdmin.from('failure_records').delete().eq('id', data.id);
      console.log('🧹 Test record cleaned up.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  }
}

checkSchema();
