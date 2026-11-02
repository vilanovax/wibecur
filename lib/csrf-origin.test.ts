import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllowedApiHosts, rejectIfCsrfOriginInvalid } from './csrf-origin';

afterEach(() => {
  vi.unstubAllEnvs();
});

function req(init: {
  method?: string;
  origin?: string | null;
  referer?: string | null;
  host?: string;
  forwardedHost?: string;
  authorization?: string;
}) {
  const headers = new Headers();
  if (init.host) headers.set('host', init.host);
  if (init.forwardedHost) headers.set('x-forwarded-host', init.forwardedHost);
  if (init.origin) headers.set('origin', init.origin);
  if (init.referer) headers.set('referer', init.referer);
  if (init.authorization) headers.set('authorization', init.authorization);
  return new Request('http://localhost:3003/api/user/profile', {
    method: init.method ?? 'POST',
    headers,
  });
}

describe('getAllowedApiHosts', () => {
  it('builds allowlist only from env, never from request Host headers', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://wibecur.ir');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.wibe.ir');
    vi.stubEnv('ALLOWED_ORIGINS', 'https://extra.example');
    const allowed = getAllowedApiHosts();
    expect(allowed.has('wibecur.ir')).toBe(true);
    expect(allowed.has('app.wibe.ir')).toBe(true);
    expect(allowed.has('extra.example')).toBe(true);
    expect(allowed.has('evil.example')).toBe(false);
  });
});

describe('rejectIfCsrfOriginInvalid', () => {
  it('allows Origin that matches NEXTAUTH_URL host', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://wibecur.ir');
    const rejected = rejectIfCsrfOriginInvalid(
      req({ host: 'ignored.local', origin: 'https://wibecur.ir' }),
      '/api/user/profile'
    );
    expect(rejected).toBeNull();
  });

  it('rejects foreign Origin even when Host matches the app', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://wibecur.ir');
    const rejected = rejectIfCsrfOriginInvalid(
      req({ host: 'wibecur.ir', origin: 'https://evil.example' }),
      '/api/user/profile'
    );
    expect(rejected).not.toBeNull();
    expect(rejected!.status).toBe(403);
  });

  it('does not trust spoofed X-Forwarded-Host to expand allowlist', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://wibecur.ir');
    const rejected = rejectIfCsrfOriginInvalid(
      req({
        host: 'wibecur.ir',
        forwardedHost: 'evil.example',
        origin: 'https://evil.example',
      }),
      '/api/user/profile'
    );
    expect(rejected?.status).toBe(403);
  });

  it('skips NextAuth and Bearer machine calls', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://wibecur.ir');
    expect(
      rejectIfCsrfOriginInvalid(
        req({ origin: 'https://evil.example' }),
        '/api/auth/callback/credentials'
      )
    ).toBeNull();

    expect(
      rejectIfCsrfOriginInvalid(
        req({
          origin: 'https://evil.example',
          authorization: 'Bearer machine-token',
        }),
        '/api/user/profile'
      )
    ).toBeNull();
  });

  it('rejects missing Origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_URL', 'https://wibecur.ir');
    const rejected = rejectIfCsrfOriginInvalid(
      req({ origin: null, referer: null }),
      '/api/user/profile'
    );
    expect(rejected?.status).toBe(403);
  });

  it('fail-closes in production when allowlist env is empty', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('ALLOWED_ORIGINS', '');
    const rejected = rejectIfCsrfOriginInvalid(
      req({ origin: 'https://wibecur.ir' }),
      '/api/user/profile'
    );
    expect(rejected?.status).toBe(403);
  });
});
