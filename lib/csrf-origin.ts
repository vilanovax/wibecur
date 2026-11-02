/**
 * دفاع CSRF برای APIهای cookie-auth:
 * درخواست‌های mutating باید Origin یا Referer هم‌منبع با اپ داشته باشند.
 *
 * Allowlist فقط از env ساخته می‌شود — Host / X-Forwarded-Host درخواست
 * قابل جعل‌اند و هرگز به لیست مجاز اضافه نمی‌شوند.
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

function hostFromEnvPart(part: string): string | null {
  const trimmed = part.trim();
  if (!trimmed) return null;
  return hostFromUrl(trimmed) ?? (trimmed.includes('://') ? null : trimmed.toLowerCase());
}

/** هاست‌های مجاز فقط از پیکربندی سرور (نه هدر درخواست) */
export function getAllowedApiHosts(): Set<string> {
  const allowed = new Set<string>();

  for (const raw of [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.ALLOWED_ORIGINS,
  ]) {
    if (!raw) continue;
    for (const part of raw.split(',')) {
      const host = hostFromEnvPart(part);
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

  const allowed = getAllowedApiHosts();
  const originHost = hostFromUrl(request.headers.get('origin'));
  const refererHost = hostFromUrl(request.headers.get('referer'));
  const candidate = originHost ?? refererHost;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!candidate) {
    // بدون Origin/Referer: در production رد؛ در dev برای curl/تست باز
    if (isProduction) {
      return Response.json(
        { error: 'درخواست نامعتبر است.' },
        { status: 403 }
      );
    }
    return null;
  }

  // production بدون allowlist پیکربندی‌شده → fail-closed
  if (allowed.size === 0) {
    if (isProduction) {
      return Response.json(
        { error: 'درخواست از مبدأ غیرمجاز رد شد.' },
        { status: 403 }
      );
    }
    // لوکال بدون NEXTAUTH_URL: چک Origin را رد نکن تا DX نشکند
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
