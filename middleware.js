import { NextResponse } from 'next/server'

export function middleware(request) {
  const isProduction = process.env.NODE_ENV === 'production'
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin-xk29z') ||
                       request.nextUrl.pathname.startsWith('/api/admin')

  if (isProduction && isAdminRoute) {
    return new NextResponse(null, { status: 404 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin-xk29z/:path*', '/api/admin/:path*'],
}
