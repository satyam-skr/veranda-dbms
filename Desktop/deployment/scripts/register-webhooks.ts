import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/supabase';
import { decryptToken } from '../lib/encryption';
import { VercelClient } from '../lib/vercel';

async function registerWebhooks() {
  console.log('🕸️  Retroactive Webhook Registration started...');
  
  // Use the production URL for webhooks so they are valid in Vercel
  const appUrl = 'https://autofix-platform.vercel.app';
  const webhookUrl = `${appUrl}/api/webhooks/vercel`;
  
  console.log(`🔗 Target Webhook URL: ${webhookUrl}`);

  // 1. Fetch all projects
  const { data: projects, error } = await supabaseAdmin
    .from('vercel_projects')
    .select('*');

  if (error || !projects) {
    console.error('❌ Failed to fetch projects:', error);
    process.exit(1);
  }

  console.log(`📋 Found ${projects.length} projects to update.`);

  for (const project of projects) {
    console.log(`\n🔄 Processing ${project.project_name} (${project.project_id})...`);
    
    try {
      // 2. Decrypt token
      const vercelToken = await decryptToken(project.vercel_token);
      const vercelClient = new VercelClient(vercelToken);
      
      // 3. Register webhook
      console.log('📡 Registering webhook on Vercel...');
      await vercelClient.createWebhook(project.project_id, webhookUrl);
      console.log('✅ Success!');
    } catch (err: any) {
      console.error(`❌ Failed: ${err.message}`);
    }
  }

  console.log('\n✨ All done!');
  process.exit(0);
}

registerWebhooks();
