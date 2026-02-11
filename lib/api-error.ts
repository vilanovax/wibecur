/**
 * در production فقط پیام امن و عمومی به کلاینت برمی‌گرداند.
 * جزئیات خطا فقط در سرور لاگ می‌شود.
 */
export function getClientErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

/**
 * لاگ یکنواخت خطا در سمت سرور (برای دیباگ و مانیتورینگ).
 */
export function logServerError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${context}]`, error.message, error.stack);
  } else {
    console.error(`[${context}]`, error);
  }
}
