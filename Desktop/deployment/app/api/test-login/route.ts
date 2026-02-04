import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simple test: set a cookie and redirect to dashboard
  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  
  // Set test cookie
  response.cookies.set('user_id', 'test-user-123', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  return response;
}
