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

    // FIXED: Correct extraction based on Vercel Webhook Schema
    // Vercel sends: payload.project.id, payload.deployment.id, payload.deployment.state
    const payload = body.payload || body;
    
    const eventType = body.type;
    // Primary: payload.project.id | Fallback: payload.projectId (for older schemas)
    const projectId = payload.project?.id || payload.projectId || body.projectId;
    const deploymentId = payload.deployment?.id || payload.deploymentId || body.deploymentId;
    const state = payload.deployment?.state || payload.state;
    // Extract repo name for later use
    const repoNameFromPayload = payload.project?.link?.repo || payload.project?.name || 'Unknown';

    console.log(`📡 Webhook State Received: ${state}`);
    console.log("✅ EXTRACTED VALUES:");
    console.log("eventType:", eventType);
    console.log("projectId:", projectId);
    console.log("deploymentId:", deploymentId);
    console.log("state:", state);
    console.log("repoName:", repoNameFromPayload);

    // Check if this is a failure event
    // User requested trigger on ERROR or FAILED state
    const isFailed = eventType === 'deployment.error' || 
                     eventType === 'deployment.failed' ||
                     state === 'ERROR' ||
                     state === 'FAILED';
    
    if (isFailed) {
      console.log('✅ FAILURE DETECTED - Preparing to trigger AutoFix');
      
      if (!projectId || !deploymentId) {
        console.error('❌ Missing Project ID or Deployment ID in webhook');
        return NextResponse.json({ success: true, error: 'Missing data logged' });
      }

      // 1. Find the project in our database
      console.log(`Searching for project in DB: ${projectId}`);
      // Changed to let to allow refreshing after update
      let { data: project, error: projectError } = await supabaseAdmin
        .from('vercel_projects')
        .select(`
          *,
          github_installations!inner (*)
        `)
        .eq('project_id', projectId)
        .single();

      // 1.5 Update Repo Name if missing (User Request) - uses repoNameFromPayload from top
      if (project && repoNameFromPayload && repoNameFromPayload !== 'Unknown' && (project.github_installations?.repo_name === 'Unknown' || !project.github_installations?.repo_name)) {
        console.log(`📝 Updating repo name for installation ${project.github_installations.id} to: ${repoNameFromPayload}`);
        await supabaseAdmin
          .from('github_installations')
          .update({ repo_name: repoNameFromPayload })
          .eq('id', project.github_installations.id);
          
        // Refresh project data to get new repo name for the loop
        const { data: refreshedProject } = await supabaseAdmin
          .from('vercel_projects')
          .select(`*, github_installations!inner (*)`)
          .eq('project_id', projectId)
          .single();
          
        if (refreshedProject) {
            project = refreshedProject; 
            console.log('✅ Project data refreshed with new repo name');
        }
      }

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
