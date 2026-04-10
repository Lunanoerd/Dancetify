import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

const isProtected = createRouteMatcher(['/dashboard(.*)'])

export function proxy(request: NextRequest) {
  return clerkMiddleware(async (auth, req) => {
    if (isProtected(req)) {
      await auth.protect()
    }
  })(request, {} as never)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
