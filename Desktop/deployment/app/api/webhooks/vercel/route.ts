import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  
  console.log('\n' + '═'.repeat(80));
  console.log(`🔔 [${timestamp}] WEBHOOK RECEIVED`);
  console.log('═'.repeat(80));
  
  try {
    const body = await req.json();
    
    console.log('📦 Webhook Body:', JSON.stringify(body, null, 2));
    console.log('🏷️  Event Type:', body.type);
    console.log('📊 Deployment State:', body.payload?.deployment?.state);
    console.log('🔗 Deployment URL:', body.payload?.deployment?.url);
    
    // Check if this is a failure event
    const isFailed = body.type === 'deployment.failed' || 
                     body.payload?.deployment?.state === 'ERROR' ||
                     body.payload?.deployment?.state === 'FAILED';
    
    console.log(`❓ Is Failure Event: ${isFailed}`);
    
    if (isFailed) {
      console.log('✅ FAILURE DETECTED - Should trigger AutoFix');
      console.log('📋 Deployment ID:', body.payload?.deployment?.id);
      console.log('📁 Project:', body.payload?.deployment?.name);
      
      // Log the call to AutoFix
      console.log('🚀 Calling AutoFix... (Webhook integration pending logic)');
      // Note: Real integration would look up project and call autonomousFixLoop
    } else {
      console.log('⏭️  Not a failure - skipping AutoFix');
    }
    
  } catch (error) {
    console.error('❌ Webhook parsing error:', error);
  }
  
  console.log('═'.repeat(80) + '\n');
  return NextResponse.json({ success: true });
}
