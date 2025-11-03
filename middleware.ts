import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware for Supabase auth - optional but recommended
// This helps refresh auth sessions automatically
export function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // In the future, you can add auth session refresh logic here
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
