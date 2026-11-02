import { normalizeAdminPermissions } from '@/lib/auth/has-permission';
import { isAdminRole } from '@/lib/auth/roles';
import type { AdminJwtSnapshot } from '@/lib/auth/admin-jwt-cache';

/** نقش ادمین را از ردیف DB روی JWT می‌نویسد؛ demote/حذف/غیرفعال را اعمال می‌کند. */
export function applyAdminJwtRow(
  token: Record<string, unknown>,
  row: AdminJwtSnapshot | null
): void {
  if (!row || row.deletedAt) {
    token.role = 'USER';
    token.isActive = false;
    token.adminPermissions = [];
    return;
  }
  if (!isAdminRole(row.role)) {
    // بعد از demote به USER — فعال بماند، فقط دسترسی ادمین قطع شود
    token.role = 'USER';
    token.isActive = row.isActive;
    token.adminPermissions = [];
    return;
  }
  if (!row.isActive) {
    token.role = row.role;
    token.isActive = false;
    token.adminPermissions = [];
    return;
  }
  token.role = row.role;
  token.isActive = row.isActive;
  token.adminPermissions = normalizeAdminPermissions(row.adminPermissions);
}

export function clearAdminSessionClaims(
  token: Record<string, unknown>,
  options?: { isActive?: boolean }
): void {
  token.role = 'USER';
  token.isActive = options?.isActive ?? false;
  token.adminPermissions = [];
}
