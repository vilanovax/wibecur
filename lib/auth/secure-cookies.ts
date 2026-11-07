/** کوکی Secure فقط روی HTTPS — روی http://localhost در npm start نباید روشن باشد */
export function shouldUseSecureAuthCookies(): boolean {
  if (process.env.AUTH_SECURE_COOKIES === 'true') return true;
  if (process.env.AUTH_SECURE_COOKIES === 'false') return false;
  if (process.env.DISABLE_SECURE_COOKIES === 'true') return false;
  const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || '';
  if (/^http:\/\//i.test(authUrl)) return false;
  if (/^https:\/\//i.test(authUrl)) return true;
  return process.env.NODE_ENV === 'production';
}
