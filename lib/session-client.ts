export const SESSION_USER_NOT_FOUND_CODE = 'SESSION_USER_NOT_FOUND';

type ApiErrorBody = { code?: string; error?: string };

export function isSessionUserNotFound(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as ApiErrorBody).code === SESSION_USER_NOT_FOUND_CODE
  );
}

/** اگر سشن با DB هم‌خوان نیست، کاربر را خارج می‌کند */
export async function signOutIfStaleSession(
  response: Response,
  body?: unknown
): Promise<boolean> {
  const data = body ?? (await response.json().catch(() => ({})));
  if (response.status === 401 && isSessionUserNotFound(data)) {
    const { signOut } = await import('next-auth/react');
    await signOut({ callbackUrl: '/login' });
    return true;
  }
  return false;
}
