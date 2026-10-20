import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearAdminJwtCache,
  readAdminJwtCache,
  rememberAdminJwtCache,
} from './admin-jwt-cache';

const row = {
  role: 'ADMIN',
  isActive: true,
  adminPermissions: ['lists.write'],
  deletedAt: null,
};

afterEach(() => {
  clearAdminJwtCache();
  vi.useRealTimers();
});

describe('admin jwt cache', () => {
  it('serves a fresh row and forgets it after a minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    expect(readAdminJwtCache('user-1')).toBeUndefined();
    rememberAdminJwtCache('user-1', row);
    expect(readAdminJwtCache('user-1')).toEqual(row);

    vi.setSystemTime(new Date('2026-01-01T00:01:00Z'));
    expect(readAdminJwtCache('user-1')).toBeUndefined();
  });

  it('holds a failed lookup briefly so a down database is not queried on every request', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    rememberAdminJwtCache('user-1', null);
    expect(readAdminJwtCache('user-1')).toBeNull();

    vi.setSystemTime(new Date('2026-01-01T00:00:15Z'));
    expect(readAdminJwtCache('user-1')).toBeUndefined();
  });
});
