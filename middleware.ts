import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

export default auth((req) => {
  // auth config's callbacks.authorized handles authorization
  // If we get here, user is authorized - continue to the page
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protect admin and profile routes - skip API, auth, static files
    '/admin/(.*)',
    '/profile',
  ],
};
