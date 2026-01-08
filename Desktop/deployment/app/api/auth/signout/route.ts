import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
  
  // Clear session cookie
  response.cookies.delete('user_id');

  return response;
}
