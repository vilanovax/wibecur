/**
 * Rate limiting — فعلاً غیرفعال (بدون Redis/Upstash).
 * APIها و middleware همچنان این توابع را صدا می‌زنند؛ همیشه allow می‌شود.
 */

export async function checkRateLimit(_identifier: string): Promise<{ success: boolean }> {
  return { success: true };
}

export async function checkActionRateLimit(
  _identifier: string,
  _max: number,
  _window: `${number} ${'s' | 'm' | 'h'}`
): Promise<{ success: boolean }> {
  return { success: true };
}
