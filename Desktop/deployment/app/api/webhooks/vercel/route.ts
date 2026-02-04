import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptToken } from '@/lib/encryption';
import { VercelClient } from '@/lib/vercel';
import { autonomousFixLoop } from '@/lib/autofix';

export async function POST(request: NextRequest) {
  console.log('🔔 WEBHOOK RECEIVED AT:', new Date().toString());
  
  try {
    const rawBody = await request.text();
    console.log("📦 RAW WEBHOOK:", rawBody);
    
    const body = JSON.parse(rawBody);
    console.log("🔍 PARSED:", JSON.stringify(body, null, 2));
    console.log('✅ Payload parsed');
    
    console.log('🔍 Checking event type...');
    const eventType = body.type;
    console.log(`⚠️ Event type is: ${eventType}`);

    const payload = body.payload;
    const deployment = payload?.deployment;
    const projectId = payload?.projectId || deployment?.projectId;
    const deploymentId = deployment?.id;
    const state = deployment?.state;
    
    console.log('🔍 Extracted data:', { projectId, deploymentId, state, eventType });
    
    // Check if this is a failure event
    const isFailed = eventType === 'deployment.error' || 
                     eventType === 'deployment.failed' || 
                     state === 'ERROR' ||
                     state === 'FAILED';
    
    if (isFailed) {
      console.log('✅ FAILURE DETECTED - Preparing to trigger AutoFix');
      const deploymentId = deployment?.id;
      
      if (!projectId || !deploymentId) {
        console.error('❌ Missing Project ID or Deployment ID in webhook');
        return NextResponse.json({ success: true, error: 'Missing data logged' });
      }

      // 1. Find the project in our database
      console.log(`Searching for project: ${projectId}`);
      const { data: project, error: projectError } = await supabaseAdmin
        .from('vercel_projects')
        .select(`
          *,
          github_installations!inner (*)
        `)
        .eq('project_id', projectId)
        .single();

      if (projectError || !project) {
        console.error('❌ Project not found in database:', projectId);
        return NextResponse.json({ success: true, error: 'Project not found logged' });
      }

      // 2. Check if AutoFix is already in progress
      if (project.is_fixing) {
        console.log('⏭️  AutoFix already in progress for this project - skipping');
        return NextResponse.json({ success: true, message: 'Already fixing' });
      }

      // 3. Decrypt token and fetch logs
      console.log('Fetching build logs...');
      const vercelToken = await decryptToken(project.vercel_token);
      const vercelClient = new VercelClient(vercelToken);
      const logs = await vercelClient.getDeploymentLogs(deploymentId, projectId);

      // 4. Create failure record
      console.log('Creating failure record in Supabase...');
      const { data: failureRecord, error: insertError } = await supabaseAdmin
        .from('failure_records')
        .insert({
          vercel_project_id: project.id,
          deployment_id: deploymentId,
          failure_source: 'vercel_webhook',
          logs,
          status: 'pending_analysis',
          attempt_count: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to create failure record:', insertError);
        return NextResponse.json({ success: true, error: 'Database error logged' });
      }

      // 5. Trigger the fix loop (non-blocking)
      console.log('🚀 Triggering autonomousFixLoop');
      autonomousFixLoop(failureRecord.id, project, vercelToken, logs).catch(err => {
        console.error('❌ Webhook error (async loop):', err);
        logger.error('AutoFix loop unhandled error', { error: String(err) });
      });

      console.log('🏁 Webhook handler completed successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Fix loop triggered',
        failureRecordId: failureRecord.id 
      });

    } else {
      console.log(`⏭️ Not a failure (state: ${deployment?.state}) - skipping AutoFix`);
    }
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    logger.error('Webhook error', { error: String(error) });
  }
  
  return NextResponse.json({ success: true });
}
