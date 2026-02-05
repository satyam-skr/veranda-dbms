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

    // DEBUG: Save raw body to DB to inspect structure
    try {
      await supabaseAdmin.from('failure_records').insert({
        vercel_project_id: 999999, // Placeholder ID
        deployment_id: 'DEBUG',
        failure_source: 'debug_webhook',
        logs: rawBody,
        status: 'pending_analysis',
        attempt_count: 0,
      });
      console.log('✅ DEBUG: Raw webhook saved to DB');
    } catch (saveError) {
      console.error('⚠️ DEBUG: Failed to save raw webhook to DB', saveError);
    }

    // Step 2: Parse JSON
    const body = JSON.parse(rawBody);
    console.log("🔍 PARSED PAYLOAD STRUCTURE:");
    console.log(JSON.stringify(body, null, 2));
    console.log("---");

    // Step 3: Log all top-level keys
    console.log("📊 TOP-LEVEL KEYS:", Object.keys(body));
    console.log("---");

    // Step 4: Log request headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("📋 REQUEST HEADERS:");
    console.log(JSON.stringify(headers, null, 2));
    console.log("---");

    // Step 5: Check for deployment object
    const payload = body.payload || body; // Vercel payloads sometimes have body as payload or are flat
    const deployment = payload.deployment || body.deployment;

    if (deployment) {
      console.log("🚀 DEPLOYMENT OBJECT:");
      console.log(JSON.stringify(deployment, null, 2));
      console.log("Deployment keys:", Object.keys(deployment));
    } else {
      console.log("⚠️ NO DEPLOYMENT OBJECT FOUND");
    }
    console.log("---");

    // Step 6: Check for common webhook properties
    console.log("🔎 CHECKING COMMON PROPERTIES:");
    console.log("body.type:", body.type);
    console.log("payload.type:", payload.type);
    console.log("payload.state:", payload.state);
    console.log("payload.target:", payload.target);
    console.log("payload.deploymentId:", payload.deploymentId);
    console.log("payload.projectId:", payload.projectId);
    console.log("deployment?.state:", deployment?.state);
    console.log("deployment?.id:", deployment?.id);
    console.log("deployment?.projectId:", deployment?.projectId);
    console.log("---");

    // Robust extraction based on observed Vercel structures
    const state = deployment?.state || payload.state || body.state;
    const eventType = body.type;
    const projectId = payload.projectId || deployment?.projectId || payload.target || body.projectId;
    const deploymentId = deployment?.id || payload.deploymentId || body.deploymentId;

    console.log("✅ EXTRACTED VALUES:");
    console.log("state:", state);
    console.log("eventType:", eventType);
    console.log("projectId:", projectId);
    console.log("deploymentId:", deploymentId);

    // Check if this is a failure event
    const isFailed = eventType === 'deployment.error' || 
                     eventType === 'deployment.failed' || 
                     state === 'ERROR' ||
                     state === 'FAILED';
    
    if (isFailed) {
      console.log('✅ FAILURE DETECTED - Preparing to trigger AutoFix');
      
      if (!projectId || !deploymentId) {
        console.error('❌ Missing Project ID or Deployment ID in webhook after robust extraction');
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
