import { describe, expect, it } from 'vitest';
import { applyAdminJwtRow } from '@/lib/auth/apply-admin-jwt';

describe('applyAdminJwtRow demotion', () => {
  it('clears admin claims when role is demoted to USER but keeps active', () => {
    const token: Record<string, unknown> = {
      role: 'SUPER_ADMIN',
      isActive: true,
      adminPermissions: ['manage_settings'],
    };
    applyAdminJwtRow(token, {
      role: 'USER',
      isActive: true,
      adminPermissions: null,
      deletedAt: null,
    });
    expect(token).toEqual({
      role: 'USER',
      isActive: true,
      adminPermissions: [],
    });
  });

  it('marks inactive admins as inactive without elevating permissions', () => {
    const token: Record<string, unknown> = {
      role: 'ADMIN',
      isActive: true,
      adminPermissions: ['manage_lists'],
    };
    applyAdminJwtRow(token, {
      role: 'ADMIN',
      isActive: false,
      adminPermissions: ['manage_lists'],
      deletedAt: null,
    });
    expect(token.role).toBe('ADMIN');
    expect(token.isActive).toBe(false);
    expect(token.adminPermissions).toEqual([]);
  });

  it('fully clears claims when the user row is missing', () => {
    const token: Record<string, unknown> = {
      role: 'SUPER_ADMIN',
      isActive: true,
      adminPermissions: ['manage_roles'],
    };
    applyAdminJwtRow(token, null);
    expect(token).toEqual({
      role: 'USER',
      isActive: false,
      adminPermissions: [],
    });
  });
});
