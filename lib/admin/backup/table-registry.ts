export type BackupTableGroup =
  | 'content'
  | 'engagement'
  | 'users'
  | 'moderation'
  | 'suggestions'
  | 'settings'
  | 'featured'
  | 'other';

export interface BackupTableMeta {
  key: string;
  label: string;
  group: BackupTableGroup;
  /** ترتیب بازیابی (کمتر = زودتر) */
  restoreOrder: number;
  restorable: boolean;
  description?: string;
}

export const BACKUP_TABLE_REGISTRY: BackupTableMeta[] = [
  { key: 'settings', label: 'تنظیمات', group: 'settings', restoreOrder: 10, restorable: true },
  { key: 'comment_settings', label: 'تنظیمات کامنت', group: 'settings', restoreOrder: 11, restorable: true },
  { key: 'categories', label: 'دسته‌بندی‌ها', group: 'content', restoreOrder: 20, restorable: true },
  { key: 'users', label: 'کاربران', group: 'users', restoreOrder: 30, restorable: true, description: 'بدون رمز' },
  { key: 'lists', label: 'لیست‌ها', group: 'content', restoreOrder: 40, restorable: true },
  { key: 'catalog_items', label: 'کاتالوگ آیتم', group: 'content', restoreOrder: 45, restorable: true },
  { key: 'items', label: 'آیتم‌ها (جایگاه در لیست)', group: 'content', restoreOrder: 50, restorable: true },
  { key: 'bookmarks', label: 'ذخیره‌ها', group: 'engagement', restoreOrder: 60, restorable: true },
  { key: 'list_likes', label: 'لایک لیست', group: 'engagement', restoreOrder: 61, restorable: true },
  { key: 'list_reactions', label: 'واکنش لیست', group: 'engagement', restoreOrder: 62, restorable: true },
  { key: 'item_votes', label: 'رأی آیتم', group: 'engagement', restoreOrder: 63, restorable: true },
  { key: 'comments', label: 'کامنت آیتم', group: 'engagement', restoreOrder: 64, restorable: true },
  { key: 'comment_likes', label: 'لایک کامنت', group: 'engagement', restoreOrder: 65, restorable: true },
  { key: 'comment_votes', label: 'رأی کامنت', group: 'engagement', restoreOrder: 66, restorable: true },
  { key: 'list_comments', label: 'کامنت لیست', group: 'engagement', restoreOrder: 67, restorable: true },
  { key: 'list_comment_likes', label: 'لایک کامنت لیست', group: 'engagement', restoreOrder: 68, restorable: true },
  { key: 'list_comment_votes', label: 'رأی کامنت لیست', group: 'engagement', restoreOrder: 69, restorable: true },
  { key: 'follows', label: 'دنبال‌کردن', group: 'engagement', restoreOrder: 70, restorable: true },
  { key: 'user_category_affinity', label: 'علاقه دسته', group: 'users', restoreOrder: 35, restorable: true },
  { key: 'creator_rankings', label: 'رتبه سازندگان', group: 'users', restoreOrder: 36, restorable: true },
  { key: 'user_achievements', label: 'دستاوردها', group: 'users', restoreOrder: 37, restorable: true },
  { key: 'bad_words', label: 'کلمات ممنوع', group: 'moderation', restoreOrder: 80, restorable: true },
  { key: 'comment_reports', label: 'ریپورت کامنت', group: 'moderation', restoreOrder: 81, restorable: true },
  { key: 'item_reports', label: 'ریپورت آیتم', group: 'moderation', restoreOrder: 82, restorable: true },
  { key: 'list_reports', label: 'ریپورت لیست', group: 'moderation', restoreOrder: 83, restorable: true },
  { key: 'comment_penalties', label: 'جریمه کامنت', group: 'moderation', restoreOrder: 84, restorable: true },
  { key: 'user_violations', label: 'تخلف کاربر', group: 'moderation', restoreOrder: 85, restorable: true },
  { key: 'list_comment_reports', label: 'ریپورت کامنت لیست', group: 'moderation', restoreOrder: 86, restorable: true },
  { key: 'moderation_cases', label: 'کیس نظارت', group: 'moderation', restoreOrder: 87, restorable: true },
  { key: 'moderation_case', label: 'کیس نظارت', group: 'moderation', restoreOrder: 87, restorable: true },
  { key: 'moderation_notes', label: 'یادداشت نظارت', group: 'moderation', restoreOrder: 88, restorable: true },
  { key: 'moderation_note', label: 'یادداشت نظارت', group: 'moderation', restoreOrder: 88, restorable: true },
  { key: 'item_moderation', label: 'نظارت آیتم', group: 'moderation', restoreOrder: 89, restorable: true },
  { key: 'suggested_lists', label: 'پیشنهاد لیست', group: 'suggestions', restoreOrder: 90, restorable: true },
  { key: 'suggested_items', label: 'پیشنهاد آیتم', group: 'suggestions', restoreOrder: 91, restorable: true },
  { key: 'home_featured_slots', label: 'اسلات منتخب', group: 'featured', restoreOrder: 100, restorable: true },
  { key: 'home_featured_events', label: 'رویداد منتخب', group: 'featured', restoreOrder: 101, restorable: true },
  { key: 'creator_spotlights', label: 'اسپات‌لایت', group: 'featured', restoreOrder: 102, restorable: true },
];

const REGISTRY_MAP = new Map(BACKUP_TABLE_REGISTRY.map((t) => [t.key, t]));

export function getTableMeta(key: string): BackupTableMeta | undefined {
  return REGISTRY_MAP.get(key);
}

export function sortTablesForRestore(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const oa = REGISTRY_MAP.get(a)?.restoreOrder ?? 999;
    const ob = REGISTRY_MAP.get(b)?.restoreOrder ?? 999;
    return oa - ob;
  });
}

export const GROUP_LABELS: Record<BackupTableGroup, string> = {
  content: 'محتوا',
  engagement: 'تعامل',
  users: 'کاربران',
  moderation: 'نظارت',
  suggestions: 'پیشنهادها',
  settings: 'تنظیمات',
  featured: 'منتخب',
  other: 'سایر',
};
