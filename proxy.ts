import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware((auth, req) => {
  // If it's a python or api route, return immediately so Clerk does nothing
  if (req.nextUrl.pathname.includes('python_api') || req.nextUrl.pathname.includes('/api/')) {
    return;
  }
});

export const config = {
  matcher: [
    // Ensure python_api is explicitly excluded from the matcher
    '/((?!python_api|api|_next/static|_next/image|favicon.ico).*)',
  ],
}
