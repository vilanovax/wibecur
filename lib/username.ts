export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function sanitizeUsernameInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '').slice(0, USERNAME_MAX);
}

export function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  const clean = normalizeUsername(username);
  if (!clean) return { valid: true };

  if (clean.length < USERNAME_MIN) {
    return {
      valid: false,
      error: `نام کاربری حداقل ${USERNAME_MIN.toLocaleString('fa-IR')} کاراکتر باشد`,
    };
  }

  if (!USERNAME_REGEX.test(clean)) {
    return {
      valid: false,
      error: 'نام کاربری فقط حروف انگلیسی، اعداد و _ (۳ تا ۳۰ کاراکتر)',
    };
  }

  return { valid: true };
}
