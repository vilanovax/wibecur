/**
 * استخراج امن IP و User-Agent از هدرهای درخواست
 */

export function getRequestMeta(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  try {
    const headers = request.headers;
    const forwarded = headers.get('x-forwarded-for');
    const ip = forwarded ? String(forwarded).split(',')[0].trim() : headers.get('x-real-ip');
    const ua = headers.get('user-agent');
    return {
      ipAddress: ip ?? null,
      userAgent: ua ?? null,
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}
