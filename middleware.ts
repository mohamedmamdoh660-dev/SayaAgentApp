import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'




export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Skip middleware for static files and Next.js internal routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.includes('.') || // Files with extensions
    path === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

 

  // All other cases, proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css)$).*)",
  ],
};
