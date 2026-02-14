import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { checkRateLimit } from '@/lib/rate-limit';

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  return 'unknown';
}

export default auth(async (req) => {
  const url = req.nextUrl;

  // Rate limiting برای API
  if (url.pathname.startsWith('/api')) {
    const ip = getClientIp(req);
    const { success } = await checkRateLimit(`api:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: 'تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید.' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/api/(.*)',
    '/admin/(.*)',
    '/profile',
  ],
};
