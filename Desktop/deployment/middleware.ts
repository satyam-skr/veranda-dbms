import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED - Testing if middleware is causing issues
  // const userId = request.cookies.get('user_id');
  // const { pathname } = request.nextUrl;

  // // Protected routes that require authentication
  // const protectedRoutes = ['/dashboard', '/setup', '/failures'];
  // const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // // Redirect to home if accessing protected route without authentication
  // if (isProtectedRoute && !userId) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/';
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

// Configure which routes use middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
