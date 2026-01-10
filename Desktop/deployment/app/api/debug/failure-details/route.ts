import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

/**
 * Enhanced debug endpoint to capture exact AUTONOMOUS failure errors
 * Visit: /api/debug/failure-details?id=FAILURE_ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const failureId = searchParams.get('id') || 'a9815c93-bbc4-4503-8bfe-69db677dc4d9';

    // Get the specific failure record WITH all relations
    const { data: failure, error } = await supabaseAdmin
      .from('failure_records')
      .select(`
        *,
        vercel_projects (
          *,
          github_installations (*)
        )
      `)
      .eq('id', failureId)
      .single();

    if (error || !failure) {
      return NextResponse.json({ error: 'Failure record not found', details: error }, { status: 404 });
    }

    // Check environment variables
    const env = {
      hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
      perplexityKeyLength: process.env.PERPLEXITY_API_KEY?.length,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // Check project structure
    const project = failure.vercel_projects;
    const installation = project?.github_installations;

    const projectCheck = {
      hasProject: !!project,
      hasInstallation: !!installation,
      hasInstallationToken: !!installation?.installation_token,
      hasAccessToken: !!installation?.access_token,
      repoOwner: installation?.repo_owner,
      repoName: installation?.repo_name,
    };

    return NextResponse.json({
      failure: {
        id: failure.id,
        status: failure.status,
        attempt_count: failure.attempt_count,
        current_branch: failure.current_branch,
        created_at: failure.created_at,
        updated_at: failure.updated_at,
        timeToFail: new Date(failure.updated_at).getTime() - new Date(failure.created_at).getTime(),
      },
      environment: env,
      projectData: projectCheck,
      diagnostic: {
        likelyIssue: !installation ? 'Missing github_installations relation' :
                     !installation.access_token ? 'Missing GitHub access token' :
                     !process.env.PERPLEXITY_API_KEY ? 'Missing PERPLEXITY_API_KEY' :
                     'Unknown - check Vercel function logs',
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
