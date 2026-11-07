import { afterEach, describe, expect, it, vi } from 'vitest';
import { shouldUseSecureAuthCookies } from './secure-cookies';

describe('shouldUseSecureAuthCookies', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('forces off for http NEXTAUTH_URL even in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3005');
    vi.stubEnv('AUTH_SECURE_COOKIES', '');
    vi.stubEnv('DISABLE_SECURE_COOKIES', '');
    expect(shouldUseSecureAuthCookies()).toBe(false);
  });

  it('forces on for https AUTH_URL', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AUTH_URL', 'https://app.wibe.ir');
    vi.stubEnv('NEXTAUTH_URL', '');
    vi.stubEnv('AUTH_SECURE_COOKIES', '');
    vi.stubEnv('DISABLE_SECURE_COOKIES', '');
    expect(shouldUseSecureAuthCookies()).toBe(true);
  });

  it('respects AUTH_SECURE_COOKIES override', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_URL', 'https://app.wibe.ir');
    vi.stubEnv('AUTH_SECURE_COOKIES', 'false');
    expect(shouldUseSecureAuthCookies()).toBe(false);
  });
});
