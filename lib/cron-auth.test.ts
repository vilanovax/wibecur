import { afterEach, describe, expect, it, vi } from 'vitest';

describe('authorizeCron', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns 503 when secret is missing', async () => {
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('REVALIDATE_SECRET', '');
    const { authorizeCron } = await import('./cron-auth');
    const result = authorizeCron(new Request('http://localhost/api/cron', { method: 'POST' }));
    expect(result).toEqual({ ok: false, status: 503, error: 'Cron secret not configured' });
  });

  it('accepts a matching Bearer token', async () => {
    vi.stubEnv('CRON_SECRET', 'super-secret-cron-token-value');
    const { authorizeCron } = await import('./cron-auth');
    const result = authorizeCron(
      new Request('http://localhost/api/cron', {
        method: 'POST',
        headers: { Authorization: 'Bearer super-secret-cron-token-value' },
      })
    );
    expect(result).toEqual({ ok: true });
  });

  it('rejects a wrong Bearer token', async () => {
    vi.stubEnv('CRON_SECRET', 'super-secret-cron-token-value');
    const { authorizeCron } = await import('./cron-auth');
    const result = authorizeCron(
      new Request('http://localhost/api/cron', {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-token' },
      })
    );
    expect(result).toEqual({ ok: false, status: 401, error: 'Unauthorized' });
  });
});
