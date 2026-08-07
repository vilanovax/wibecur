import type { AuditAction, AuditEntityType } from '@/lib/audit/actions';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LIST_DELETE: 'حذف لیست',
  LIST_SOFT_DELETE: 'حذف نرم لیست',
  LIST_RESTORE: 'بازیابی لیست',
  LIST_UPDATE: 'ویرایش لیست',
  LIST_BOOST: 'بوست لیست',
  CATEGORY_DELETE: 'حذف دسته',
  CATEGORY_SOFT_DELETE: 'حذف نرم دسته',
  CATEGORY_RESTORE: 'بازیابی دسته',
  CATEGORY_UPDATE: 'ویرایش دسته',
  CATEGORY_WEIGHT_CHANGE: 'تغییر وزن دسته',
  ITEM_SOFT_DELETE: 'حذف نرم آیتم',
  ITEM_RESTORE: 'بازیابی آیتم',
  USER_SUSPEND: 'تعلیق کاربر',
  USER_SOFT_DELETE: 'حذف نرم کاربر',
  USER_RESTORE: 'بازیابی کاربر',
  USER_ROLE_CHANGE: 'تغییر نقش کاربر',
  USER_SHADOW_BAN: 'سایه‌بن کاربر',
  REPORT_RESOLVE: 'رسیدگی گزارش',
  COMMENT_DELETE: 'حذف نظر',
  COMMENT_PENALTY: 'جریمه نظر',
  COMMENT_REPORTS_DISCARDED: 'رد گزارش‌های نظر',
  COMMENT_RESTRICT: 'محدودیت نظر',
  COMMENT_UNRESTRICT: 'رفع محدودیت نظر',
  COMMENT_BAN: 'بن نظر',
  MOD_CASE_ASSIGN: 'تخصیص پرونده',
  MOD_CASE_STATUS_CHANGE: 'تغییر وضعیت پرونده',
  MOD_NOTE_ADD: 'یادداشت پرونده',
  MOD_ACTION_TRASH_LIST: 'حذف لیست (مدیریت)',
  MOD_ACTION_SUSPEND_USER: 'تعلیق کاربر (مدیریت)',
};

export const ENTITY_TYPE_LABELS: Record<AuditEntityType, string> = {
  LIST: 'لیست',
  USER: 'کاربر',
  CATEGORY: 'دسته',
  ITEM: 'آیتم',
  REPORT: 'گزارش',
  COMMENT: 'نظر',
};

export const FIELD_LABELS: Record<string, string> = {
  id: 'شناسه',
  title: 'عنوان',
  name: 'نام',
  slug: 'اسلاگ',
  categoryId: 'شناسه دسته',
  isActive: 'فعال',
  isFeatured: 'ویژه',
  badge: 'نشان',
  order: 'ترتیب',
  trendingWeight: 'وزن ترند',
  email: 'ایمیل',
  role: 'نقش',
  saveCount: 'تعداد ذخیره',
  updatedAt: 'زمان به‌روزرسانی',
};

/** فیلدهایی که در نمای اصلی diff پنهان می‌شوند */
export const TECHNICAL_DIFF_FIELDS = new Set(['id', 'updatedAt']);

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action as AuditAction] ?? action;
}

export function getEntityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType as AuditEntityType] ?? entityType;
}

export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

export function formatAuditValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'بله' : 'خیر';
  if (key === 'role' && typeof value === 'string') {
    const roles: Record<string, string> = {
      ADMIN: 'مدیر',
      MODERATOR: 'ناظر',
      USER: 'کاربر',
    };
    return roles[value] ?? value;
  }
  if (key.endsWith('At') || key.includes('Date')) {
    const d = new Date(String(value));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export type AuditDiffRow = {
  key: string;
  label: string;
  before: string;
  after: string;
  technical: boolean;
};

export function getAuditDiffRows(before: unknown, after: unknown): AuditDiffRow[] {
  if (before == null && after == null) return [];
  if (before == null || after == null || typeof before !== 'object' || typeof after !== 'object') {
    return [];
  }

  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(b), ...Object.keys(a)]);

  const rows: AuditDiffRow[] = [];
  keys.forEach((key) => {
    const vb = JSON.stringify(b[key]);
    const va = JSON.stringify(a[key]);
    if (vb === va) return;
    rows.push({
      key,
      label: getFieldLabel(key),
      before: formatAuditValue(key, b[key]),
      after: formatAuditValue(key, a[key]),
      technical: TECHNICAL_DIFF_FIELDS.has(key),
    });
  });

  return rows.sort((x, y) => {
    if (x.technical !== y.technical) return x.technical ? 1 : -1;
    return x.label.localeCompare(y.label, 'fa');
  });
}

export function getEntityDisplayName(
  entityType: string,
  before: unknown,
  after: unknown
): string | null {
  const pick = (obj: unknown, ...keys: string[]) => {
    if (!obj || typeof obj !== 'object') return null;
    const rec = obj as Record<string, unknown>;
    for (const key of keys) {
      const val = rec[key];
      if (typeof val === 'string' && val.trim()) return val.trim();
    }
    return null;
  };

  if (entityType === 'LIST' || entityType === 'ITEM') {
    return pick(after, 'title') ?? pick(before, 'title');
  }
  if (entityType === 'CATEGORY') {
    return pick(after, 'name') ?? pick(before, 'name');
  }
  if (entityType === 'USER') {
    return pick(after, 'email', 'name') ?? pick(before, 'email', 'name');
  }
  return pick(after, 'title', 'name') ?? pick(before, 'title', 'name');
}

export function summarizeChangedFields(
  before: unknown,
  after: unknown,
  max = 3
): string {
  const rows = getAuditDiffRows(before, after).filter((r) => !r.technical);
  if (rows.length === 0) {
    const technical = getAuditDiffRows(before, after).filter((r) => r.technical);
    if (technical.length > 0) return 'فقط متادیتای فنی';
    return '';
  }
  const labels = rows.slice(0, max).map((r) => r.label);
  const rest = rows.length - labels.length;
  return rest > 0 ? `${labels.join('، ')} +${rest}` : labels.join('، ');
}

export function parseUserAgentShort(ua: string | null | undefined): string | null {
  if (!ua?.trim()) return null;
  const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0];
  const os = ua.match(/\(([^)]+)\)/)?.[1]?.split(';')[0]?.trim();
  if (browser && os) return `${browser} · ${os}`;
  if (browser) return browser;
  return ua.length > 60 ? `${ua.slice(0, 60)}…` : ua;
}
