import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  API_RATE_LIMIT_MAX,
  IMAGE_RATE_LIMIT_MAX,
  SESSION_RATE_LIMIT_MAX,
  apiRateBucket,
  checkActionRateLimit,
  checkApiRateLimit,
  checkRateLimit,
  clearRateLimitsForTests,
  createRateLimiter,
  rateWindowMs,
} from './rate-limit';

afterEach(() => {
  clearRateLimitsForTests();
  vi.useRealTimers();
});

describe('rateWindowMs', () => {
  it('parses seconds, minutes and hours', () => {
    expect(rateWindowMs('15 m')).toBe(15 * 60_000);
    expect(rateWindowMs('1 h')).toBe(3_600_000);
    expect(rateWindowMs('30 s')).toBe(30_000);
  });
});

describe('checkActionRateLimit', () => {
  it('blocks the request after the max and allows it again when the window ends', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    for (let i = 0; i < 5; i += 1) {
      expect((await checkActionRateLimit('register:198.51.100.8', 5, '1 h')).success).toBe(true);
    }
    expect((await checkActionRateLimit('register:198.51.100.8', 5, '1 h')).success).toBe(false);

    vi.setSystemTime(new Date('2026-01-01T01:00:00Z'));
    expect((await checkActionRateLimit('register:198.51.100.8', 5, '1 h')).success).toBe(true);
  });

  it('keeps separate buckets per identifier', async () => {
    expect((await checkActionRateLimit('image:a', 1, '1 m')).success).toBe(true);
    expect((await checkActionRateLimit('image:a', 1, '1 m')).success).toBe(false);
    expect((await checkActionRateLimit('image:b', 1, '1 m')).success).toBe(true);
  });
});

describe('apiRateBucket', () => {
  it('puts session and image reads in their own buckets', () => {
    expect(apiRateBucket('/api/auth/session', 'GET')).toBe('session');
    expect(apiRateBucket('/api/auth/session', 'POST')).toBe('session');
    expect(apiRateBucket('/api/auth/callback/credentials', 'POST')).toBe('default');
    expect(apiRateBucket('/api/liara-image', 'GET')).toBe('image');
    expect(apiRateBucket('/api/storage-image', 'GET')).toBe('image');
    expect(apiRateBucket('/api/notifications', 'GET')).toBe('default');
  });

  it('does not let a full page budget block the session read', async () => {
    for (let i = 0; i < API_RATE_LIMIT_MAX; i += 1) {
      expect((await checkApiRateLimit('default', '198.51.100.8')).success).toBe(true);
    }
    expect((await checkApiRateLimit('default', '198.51.100.8')).success).toBe(false);
    expect((await checkApiRateLimit('session', '198.51.100.8')).success).toBe(true);
  });

  it('blocks session only after its own ceiling', async () => {
    for (let i = 0; i < SESSION_RATE_LIMIT_MAX; i += 1) {
      expect((await checkApiRateLimit('session', '198.51.100.9')).success).toBe(true);
    }
    expect((await checkApiRateLimit('session', '198.51.100.9')).success).toBe(false);
    expect(IMAGE_RATE_LIMIT_MAX).toBeGreaterThan(API_RATE_LIMIT_MAX);
  });
});

describe('checkRateLimit', () => {
  it('allows the middleware ceiling and blocks the next call', async () => {
    for (let i = 0; i < API_RATE_LIMIT_MAX; i += 1) {
      expect((await checkRateLimit('api:198.51.100.8')).success).toBe(true);
    }
    expect((await checkRateLimit('api:198.51.100.8')).success).toBe(false);
  });
});

describe('createRateLimiter', () => {
  it('drops the oldest bucket when the map is full', async () => {
    const limiter = createRateLimiter({ maxBuckets: 2 });
    expect((await limiter.check('b', 1, '1 m')).success).toBe(true);
    expect((await limiter.check('a', 1, '1 m')).success).toBe(true);
    expect((await limiter.check('a', 1, '1 m')).success).toBe(false);
    expect((await limiter.check('c', 1, '1 m')).success).toBe(true);
    expect(limiter.size()).toBe(2);
    expect((await limiter.check('a', 1, '1 m')).success).toBe(false);
    expect((await limiter.check('b', 1, '1 m')).success).toBe(true);
  });
});
