import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard'])

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.includes('python_api') || req.nextUrl.pathname.includes('/api/')) {
    return;
  }
  if (isProtectedRoute(req)) await auth.protect()
});

export const config = {
  matcher: [
    '/((?!python_api|api|_next/static|_next/image|favicon.ico).*)',
  ],
}
