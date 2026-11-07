import { describe, expect, it } from 'vitest';
import { buildAdminLoginUrl } from './login-redirect';
import { firstAccessibleAdminHref } from './admin-menu';

describe('buildAdminLoginUrl', () => {
  it('keeps admin callback paths', () => {
    expect(buildAdminLoginUrl('/admin/lists')).toBe(
      `/login?callbackUrl=${encodeURIComponent('/admin/lists')}`
    );
  });

  it('falls back for non-admin paths', () => {
    expect(buildAdminLoginUrl('/profile')).toBe(
      `/login?callbackUrl=${encodeURIComponent('/admin/dashboard')}`
    );
  });
});

describe('firstAccessibleAdminHref', () => {
  it('returns dashboard when allowed', () => {
    expect(firstAccessibleAdminHref((p) => p === 'view_dashboard')).toBe('/admin/dashboard');
  });

  it('skips denied entries', () => {
    expect(firstAccessibleAdminHref((p) => p === 'manage_settings')).toBe('/admin/settings');
  });

  it('returns null when nothing is allowed', () => {
    expect(firstAccessibleAdminHref(() => false)).toBeNull();
  });
});
