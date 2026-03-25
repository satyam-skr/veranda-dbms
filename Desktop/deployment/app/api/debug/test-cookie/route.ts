import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Test if we can set a cookie at all
  const response = NextResponse.json({ 
    message: 'Cookie test endpoint',
    timestamp: new Date().toISOString(),
  });

  // Try different cookie configurations
  response.cookies.set('test_cookie_lax', 'test_value_lax', {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });

  response.cookies.set('test_cookie_none', 'test_value_none', {
    httpOnly: false,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 60 * 60,
  });

  response.cookies.set('test_cookie_simple', 'test_value_simple', {
    path: '/',
    maxAge: 60 * 60,
  });

  return response;
}
