import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptToken } from '@/lib/encryption';
import { VercelClient } from '@/lib/vercel';
import { autonomousFixLoop } from '@/lib/autofix';

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 WEBHOOK RECEIVED AT:', new Date().toString());

    // Step 1: Capture raw body
    const rawBody = await request.text();
    console.log("📦 RAW WEBHOOK BODY:");
    console.log(rawBody);
    console.log("---");

    // Step 2: Parse JSON
    const body = JSON.parse(rawBody);

    // Correct extraction based on actual Vercel webhook structure
    const eventType = body.type;
    const projectId = body.payload?.projectId;
    const deploymentId = body.payload?.deployment?.id;
    const state = body.payload?.deployment?.state;

    console.log("✅ EXTRACTED VALUES:");
    console.log("eventType:", eventType);
    console.log("projectId:", projectId);
    console.log("deploymentId:", deploymentId);
    console.log("state:", state);

    // Check if this is a failure event
    const isFailed = eventType === 'deployment.error' || 
                     eventType === 'deployment.failed';
    
    if (isFailed) {
      console.log('✅ FAILURE DETECTED - Preparing to trigger AutoFix');
      
      if (!projectId || !deploymentId) {
        console.error('❌ Missing Project ID or Deployment ID in webhook');
        return NextResponse.json({ success: true, error: 'Missing data logged' });
      }

      // 1. Find the project in our database
      console.log(`Searching for project in DB: ${projectId}`);
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
      console.log(`⏭️ Not a failure (state: ${state}, type: ${eventType}) - skipping AutoFix`);
    }
    
  } catch (error) {
    console.error('💥 WEBHOOK ERROR:', error);
    logger.error('Webhook error', { error: String(error) });
  }
  
  return NextResponse.json({ success: true });
}
