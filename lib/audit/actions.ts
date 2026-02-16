/**
 * نام‌گذاری استاندارد اکشن‌های Audit
 * هر اکشن حساس باید اینجا تعریف شود.
 */

export const AUDIT_ACTIONS = [
  'LIST_DELETE',
  'LIST_SOFT_DELETE',
  'LIST_RESTORE',
  'LIST_UPDATE',
  'LIST_BOOST',
  'CATEGORY_DELETE',
  'CATEGORY_SOFT_DELETE',
  'CATEGORY_RESTORE',
  'CATEGORY_UPDATE',
  'CATEGORY_WEIGHT_CHANGE',
  'USER_SUSPEND',
  'USER_SOFT_DELETE',
  'USER_RESTORE',
  'USER_ROLE_CHANGE',
  'USER_SHADOW_BAN',
  'REPORT_RESOLVE',
  'COMMENT_DELETE',
  'MOD_CASE_ASSIGN',
  'MOD_CASE_STATUS_CHANGE',
  'MOD_NOTE_ADD',
  'MOD_ACTION_TRASH_LIST',
  'MOD_ACTION_SUSPEND_USER',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ENTITY_TYPES = ['LIST', 'USER', 'CATEGORY', 'ITEM', 'REPORT', 'COMMENT'] as const;
export type AuditEntityType = (typeof ENTITY_TYPES)[number];
