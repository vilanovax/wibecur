import { describe, expect, it } from 'vitest';
import { visibleAdminMenu } from '@/lib/admin/admin-menu';
import { ROLE_PERMISSIONS } from '@/lib/auth/permission-map';

describe('admin menu and roles', () => {
  it('keeps admin management and backup on the super admin role', () => {
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toContain('manage_roles');
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toContain('manage_backup');
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain('manage_roles');
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain('manage_backup');
    expect(ROLE_PERMISSIONS.ADMIN).toContain('manage_settings');
  });

  it('shows sidebar links that match the effective permissions', () => {
    const menu = visibleAdminMenu(ROLE_PERMISSIONS.EDITOR);
    const labels = menu.flatMap((group) => group.links.map((link) => link.label));
    expect(labels).toContain('دسته‌بندی‌ها');
    expect(labels).toContain('لیست‌ها');
    expect(labels).not.toContain('ادمین‌ها');
    expect(labels).not.toContain('پشتیبان‌گیری');
    expect(labels).not.toContain('تنظیمات');
  });

  it('hides the whole menu when no permission matches', () => {
    expect(visibleAdminMenu([])).toEqual([]);
  });
});
