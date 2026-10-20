import { afterEach, describe, expect, it } from 'vitest';
import { getClientIp, trustedProxyCount } from './client-ip';

function headers(forwarded: string | null) {
  return {
    get(name: string) {
      return name.toLowerCase() === 'x-forwarded-for' ? forwarded : null;
    },
  };
}

const original = process.env.TRUSTED_PROXY_COUNT;

afterEach(() => {
  if (original === undefined) delete process.env.TRUSTED_PROXY_COUNT;
  else process.env.TRUSTED_PROXY_COUNT = original;
});

describe('getClientIp', () => {
  it('uses the last hop when one proxy is trusted', () => {
    delete process.env.TRUSTED_PROXY_COUNT;
    expect(trustedProxyCount()).toBe(1);
    expect(getClientIp(headers('203.0.113.9, 198.51.100.8'))).toBe('198.51.100.8');
    expect(getClientIp(headers('198.51.100.8'))).toBe('198.51.100.8');
  });

  it('ignores a forged first address', () => {
    delete process.env.TRUSTED_PROXY_COUNT;
    expect(getClientIp(headers('1.1.1.1, 2.2.2.2, 198.51.100.8'))).toBe('198.51.100.8');
  });

  it('returns unknown when the header is missing', () => {
    delete process.env.TRUSTED_PROXY_COUNT;
    expect(getClientIp(headers(null))).toBe('unknown');
    expect(getClientIp(headers('  ,  '))).toBe('unknown');
  });

  it('ignores the header when no proxy is trusted', () => {
    process.env.TRUSTED_PROXY_COUNT = '0';
    expect(getClientIp(headers('198.51.100.8'))).toBe('unknown');
  });

  it('walks back by the trusted hop count', () => {
    process.env.TRUSTED_PROXY_COUNT = '2';
    expect(getClientIp(headers('203.0.113.5, 198.51.100.8'))).toBe('203.0.113.5');
    expect(getClientIp(headers('203.0.113.5'))).toBe('203.0.113.5');
  });
});
