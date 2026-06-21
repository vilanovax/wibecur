import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { checkRateLimit } from '@/lib/rate-limit';
import { readMaintenanceRuntimeFlag } from '@/lib/maintenance-runtime';
import { isAdminRole, isMaintenanceBypassPath } from '@/lib/maintenance-mode-types';

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  return 'unknown';
}

function getRequestOrigin(url: URL, req: Request): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  if (host) return `${proto}://${host}`;
  return url.origin;
}

async function fetchMaintenanceStatus(origin: string): Promise<{
  enabled: boolean;
  allowAdminBrowse: boolean;
} | null> {
  try {
    const res = await fetch(`${origin}/api/site/maintenance-status`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function resolveMaintenanceStatus(
  url: URL,
  req: Request
): Promise<{ enabled: boolean; allowAdminBrowse: boolean } | null> {
  const fromRedis = await readMaintenanceRuntimeFlag();
  if (fromRedis) return fromRedis;
  return fetchMaintenanceStatus(getRequestOrigin(url, req));
}

export default auth(async (req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;

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

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  if (!isMaintenanceBypassPath(pathname)) {
    const status = await resolveMaintenanceStatus(url, req);
    if (status?.enabled) {
      const adminBypass =
        status.allowAdminBrowse && isAdminRole(req.auth?.user?.role);
      if (!adminBypass) {
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { error: 'سایت در حال به‌روزرسانی است. لطفاً بعداً تلاش کنید.' },
            { status: 503 }
          );
        }
        if (pathname !== '/maintenance') {
          const rewriteUrl = req.nextUrl.clone();
          rewriteUrl.pathname = '/maintenance';
          return NextResponse.rewrite(rewriteUrl, {
            request: { headers: requestHeaders },
          });
        }
      }
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
