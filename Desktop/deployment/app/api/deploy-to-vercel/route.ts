import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { VercelAutoDeployService } from '@/lib/vercel-auto-deploy';
import { logger } from '@/utils/logger';

/**
 * API endpoint to deploy a GitHub repo to Vercel
 * Called when user clicks "Deploy to Vercel" button on dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { githubInstallationId } = body;

    if (!githubInstallationId) {
      return NextResponse.json({ error: 'Missing githubInstallationId' }, { status: 400 });
    }

    // Get GitHub installation details
    const { data: installation, error: fetchError } = await supabaseAdmin
      .from('github_installations')
      .select('*')
      .eq('id', githubInstallationId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !installation) {
      logger.error('Installation not found', { githubInstallationId, error: fetchError });
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }

    logger.info('🚀 Starting Vercel deployment', {
      repo: `${installation.repo_owner}/${installation.repo_name}`,
    });

    // Trigger Vercel deployment
    const autoDeployService = new VercelAutoDeployService();
    const deploymentResult = await autoDeployService.autoDeployRepository({
      userId,
      githubInstallationId: installation.id,
      installationId: installation.installation_id,
      repoOwner: installation.repo_owner,
      repoName: installation.repo_name,
    });

    logger.info('✅ Deployment started', {
      vercelProjectId: deploymentResult.vercelProjectId,
      deploymentUrl: deploymentResult.deploymentUrl,
    });

    return NextResponse.json({
      success: true,
      vercelProjectId: deploymentResult.vercelProjectId,
      deploymentUrl: deploymentResult.deploymentUrl,
      deploymentId: deploymentResult.deploymentId,
    });
  } catch (error) {
    logger.error('Deploy to Vercel failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Deployment failed', details: String(error) },
      { status: 500 }
    );
  }
}
