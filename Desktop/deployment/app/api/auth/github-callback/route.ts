import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptToken } from '@/lib/encryption';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('🔵 GitHub callback STARTED', {
      url: request.url,
      method: request.method,
    });

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const installationId = searchParams.get('installation_id');

    // DETECT & FORWARD MISDIRECTED INSTALLATION CALLBACKS
    // 1. If 'setup_action' is present, it is definitely an installation callback.
    // 2. If 'installation_id' is present but NO 'code', it is an installation callback sent to the wrong URL.
    if (installationId && (searchParams.has('setup_action') || !code)) {
      logger.warn('⚠️ Forwarding confirmed installation callback to correct handler', {
        params: searchParams.toString()
      });
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${baseUrl}/api/github/installation-callback?${searchParams.toString()}`);
    }

    if (!code) {
      logger.error('No OAuth code provided', { 
        params: Object.fromEntries(searchParams.entries()) 
      });
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${baseUrl}?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      logger.error('GitHub OAuth error', { error: tokenData.error });
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${baseUrl}?error=oauth_failed`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    const userData = await userResponse.json();

    if (!userData.email) {
      // Try to get email from emails endpoint
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      userData.email = primaryEmail?.email || `${userData.login}@users.noreply.github.com`;
    }

    // Encrypt access token
    const encryptedToken = await encryptToken(accessToken);

    // Upsert user in database
    const { data: user, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          email: userData.email,
          github_username: userData.login,
          github_access_token: encryptedToken,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
        }
      )
      .select()
      .single();

    if (upsertError || !user) {
      logger.error('Failed to upsert user', { error: upsertError });
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      return NextResponse.redirect(`${baseUrl}?error=db_error`);
    }

    logger.info('User authenticated', { userId: user.id, username: userData.login });

    // Set session cookie with settings that work for OAuth on Vercel
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    logger.info('🍪 About to set cookie', { 
      userId: user.id,
      baseUrl,
      redirectTo: `${baseUrl}/dashboard`
    });

    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    
    // Check protocol reliably (Vercel uses X-Forwarded-Proto)
    const protocol = request.headers.get('x-forwarded-proto') || url.protocol;
    const isSecure = protocol.includes('https');
    
    // Approach 1: Standard session cookie
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: isSecure, // Only secure in production/https
      sameSite: 'lax',  // reliable default
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    // Approach 2: Debug cookie
    response.cookies.set('user_id_debug', user.id, {
      httpOnly: false,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    logger.info('✅ Cookie set for user', { 
      userId: user.id,
      cookieCount: 2,
      responseStatus: response.status
    });

    return response;
  } catch (error) {
    logger.error('GitHub callback error', { error: String(error) });
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(`${baseUrl}?error=server_error`);
  }
}
