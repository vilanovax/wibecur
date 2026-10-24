import { describe, expect, it } from 'vitest';
import { allowUmamiSend, shouldTrackUmamiHost, shouldTrackUmamiPath } from './umami';

describe('shouldTrackUmamiHost', () => {
  it('skips local hosts when no domain list is set', () => {
    expect(shouldTrackUmamiHost('localhost')).toBe(false);
    expect(shouldTrackUmamiHost('127.0.0.1')).toBe(false);
    expect(shouldTrackUmamiHost('[::1]')).toBe(false);
    expect(shouldTrackUmamiHost('wibe.ir')).toBe(true);
  });

  it('follows an explicit domain list, including localhost', () => {
    expect(shouldTrackUmamiHost('localhost', 'wibe.ir')).toBe(false);
    expect(shouldTrackUmamiHost('wibe.ir', 'wibe.ir, www.wibe.ir')).toBe(true);
    expect(shouldTrackUmamiHost('localhost', 'localhost')).toBe(true);
  });
});

describe('shouldTrackUmamiPath', () => {
  it('skips the admin panel', () => {
    expect(shouldTrackUmamiPath('/admin')).toBe(false);
    expect(shouldTrackUmamiPath('/admin/media')).toBe(false);
    expect(shouldTrackUmamiPath('/lists')).toBe(true);
  });
});

describe('allowUmamiSend', () => {
  it('stops after twenty sends in the same minute', () => {
    const recent: number[] = [];
    for (let i = 0; i < 20; i += 1) expect(allowUmamiSend(1_000, recent)).toBe(true);
    expect(allowUmamiSend(1_000, recent)).toBe(false);
    expect(allowUmamiSend(61_000, recent)).toBe(true);
  });
});
