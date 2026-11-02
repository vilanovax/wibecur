/**
 * دفاع CSRF برای APIهای cookie-auth:
 * درخواست‌های mutating باید Origin یا Referer هم‌منبع با اپ داشته باشند.
 */

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function hostFromUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return null;
  }
}

/** هاست‌های مجاز از env + Host همان درخواست */
export function getAllowedApiHosts(request: Request): Set<string> {
  const allowed = new Set<string>();

  const requestHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (requestHost) {
    allowed.add(requestHost.split(',')[0]!.trim().toLowerCase());
  }

  for (const raw of [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.ALLOWED_ORIGINS,
  ]) {
    if (!raw) continue;
    for (const part of raw.split(',')) {
      const host = hostFromUrl(part.trim()) ?? (part.includes('://') ? null : part.trim().toLowerCase());
      if (host) allowed.add(host);
    }
  }

  return allowed;
}

function pathShouldSkipOriginCheck(pathname: string): boolean {
  // Auth.js CSRF خودش را دارد؛ machine endpoints با Bearer جداگانه محافظت می‌شوند.
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/api/ingest')) return true;
  if (pathname.startsWith('/api/cron')) return true;
  if (pathname === '/api/health') return true;
  return false;
}

/**
 * اگر درخواست باید رد شود، پاسخ ۴۰۳ برمی‌گرداند؛ وگرنه null.
 */
export function rejectIfCsrfOriginInvalid(
  request: Request,
  pathname: string
): Response | null {
  if (!pathname.startsWith('/api')) return null;
  if (!MUTATING.has(request.method.toUpperCase())) return null;
  if (pathShouldSkipOriginCheck(pathname)) return null;

  // فراخوانی‌های ماشین با Bearer (ingest/cron قبلاً skip؛ بقیه هم اگر Bearer دارند)
  const auth = request.headers.get('authorization') ?? '';
  if (/^Bearer\s+\S+/i.test(auth)) return null;

  const allowed = getAllowedApiHosts(request);
  const originHost = hostFromUrl(request.headers.get('origin'));
  const refererHost = hostFromUrl(request.headers.get('referer'));
  const candidate = originHost ?? refererHost;

  if (!candidate) {
    // بدون Origin/Referer: در production رد؛ در dev برای curl/تست باز
    if (process.env.NODE_ENV === 'production') {
      return Response.json(
        { error: 'درخواست نامعتبر است.' },
        { status: 403 }
      );
    }
    return null;
  }

  if (!allowed.has(candidate)) {
    return Response.json(
      { error: 'درخواست از مبدأ غیرمجاز رد شد.' },
      { status: 403 }
    );
  }

  return null;
}
