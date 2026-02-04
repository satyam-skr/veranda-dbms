import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptToken } from '@/lib/encryption';
import { VercelClient } from '@/lib/vercel';
import { autonomousFixLoop } from '@/lib/autofix';

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  
  console.log('\n' + '═'.repeat(80));
  console.log(`🔔 [${timestamp}] WEBHOOK RECEIVED`);
  console.log('═'.repeat(80));
  
  try {
    const body = await req.json();
    
    // Vercel webhooks for deployment.status_changed
    const eventType = body.type;
    const payload = body.payload;
    const deployment = payload?.deployment;
    const projectId = payload?.projectId || deployment?.projectId;
    
    console.log('📦 Webhook Body:', JSON.stringify(body, null, 2));
    console.log('🏷️  Event Type:', eventType);
    console.log('📊 Deployment State:', deployment?.state);
    
    // Check if this is a failure event
    const isFailed = eventType === 'deployment.error' || 
                     eventType === 'deployment.failed' || 
                     deployment?.state === 'ERROR' ||
                     deployment?.state === 'FAILED';
    
    if (isFailed) {
      console.log('✅ FAILURE DETECTED - Triggering AutoFix');
      const deploymentId = deployment?.id;
      
      if (!projectId || !deploymentId) {
        console.error('❌ Missing Project ID or Deployment ID in webhook');
        return NextResponse.json({ success: false, error: 'Missing data' });
      }

      // 1. Find the project in our database
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
        return NextResponse.json({ success: false, error: 'Project not found' });
      }

      // 2. Check if AutoFix is already in progress
      if (project.is_fixing) {
        console.log('⏭️  AutoFix already in progress for this project - skipping');
        return NextResponse.json({ success: true, message: 'Already fixing' });
      }

      // 3. Decrypt token and fetch logs
      const vercelToken = await decryptToken(project.vercel_token);
      const vercelClient = new VercelClient(vercelToken);
      const logs = await vercelClient.getDeploymentLogs(deploymentId, projectId);

      // 4. Create failure record
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
        return NextResponse.json({ success: false, error: 'Database error' });
      }

      // 5. Trigger the fix loop (non-blocking)
      console.log('🚀 Launching Autonomous Fix Loop...');
      autonomousFixLoop(failureRecord.id, project, vercelToken, logs).catch(err => {
        console.error('❌ AutoFix Loop failed:', err);
        logger.error('AutoFix loop unhandled error', { error: String(err) });
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Fix loop triggered',
        failureRecordId: failureRecord.id 
      });

    } else {
      console.log('⏭️  Not a failure - skipping AutoFix');
    }
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    logger.error('Webhook error', { error: String(error) });
  }
  
  console.log('═'.repeat(80) + '\n');
  return NextResponse.json({ success: true });
}
