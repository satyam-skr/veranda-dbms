import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';

async function checkWebhookSource() {
  console.log('🔍 Checking for failure records from SOURCE: vercel_webhook...');

  try {
    const { data, error } = await supabaseAdmin
      .from('failure_records')
      .select('*')
      .eq('failure_source', 'vercel_webhook')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // If no rows, single() returns an error code usually
      if (error.code === 'PGRST116') {
         console.log('⚠️ No records found with failure_source = vercel_webhook');
      } else {
         console.error('❌ Database error:', error);
      }
      process.exit(0);
    }

    if (data) {
      console.log('✅ Webhook Record Found!');
      console.log(`🆔 ID: ${data.id}`);
      console.log(`📅 Created: ${data.created_at}`);
      console.log(`🚀 Deployment ID: ${data.deployment_id}`);
      console.log(`🏷️  Source: ${data.failure_source}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    process.exit(1);
  }
}

checkWebhookSource();
