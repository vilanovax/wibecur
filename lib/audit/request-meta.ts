/**
 * استخراج امن IP و User-Agent از هدرهای درخواست
 */

import { getClientIp } from '@/lib/client-ip';

export function getRequestMeta(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  try {
    const headers = request.headers;
    const ip = getClientIp(headers);
    const ua = headers.get('user-agent');
    return {
      ipAddress: ip === 'unknown' ? null : ip,
      userAgent: ua ?? null,
    };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}
