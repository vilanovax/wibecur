export const CONTENT_SCOPES = ['categories', 'lists', 'items'] as const;
export type ContentScope = (typeof CONTENT_SCOPES)[number];

/** @deprecated legacy — expands to categories + lists + items */
export const LEGACY_CONTENT_SCOPE = 'content' as const;

export const BACKUP_SCOPES = [
  LEGACY_CONTENT_SCOPE,
  ...CONTENT_SCOPES,
  'engagement',
  'users',
  'moderation',
  'suggestions',
  'settings',
  'featured',
  'full',
] as const;

export type BackupScope = (typeof BACKUP_SCOPES)[number];

export const SELECTABLE_BACKUP_SCOPES = BACKUP_SCOPES.filter(
  (s) => s !== 'full' && s !== LEGACY_CONTENT_SCOPE
) as Exclude<BackupScope, 'full' | typeof LEGACY_CONTENT_SCOPE>[];

export const BACKUP_ASSET_MODES = ['none', 'urls_only'] as const;
export type BackupAssetMode = (typeof BACKUP_ASSET_MODES)[number];

export const BACKUP_SCOPE_LABELS: Record<BackupScope, string> = {
  content: 'محتوا (دسته، لیست، آیتم)',
  categories: 'دسته‌بندی‌ها',
  lists: 'لیست‌ها',
  items: 'آیتم‌ها',
  engagement: 'تعامل (ذخیره، کامنت، رأی)',
  users: 'کاربران (بدون رمز)',
  moderation: 'نظارت (ریپورت، کلمات ممنوع)',
  suggestions: 'پیشنهادها',
  settings: 'تنظیمات (بدون API key)',
  featured: 'منتخب هوم',
  full: 'همه بخش‌ها',
};

export interface BackupRequestOptions {
  scopes: BackupScope[];
  assetMode: BackupAssetMode;
  includeTrash: boolean;
}

export interface BackupManifestV1 {
  version: 1;
  app: 'WibeCur';
  createdAt: string;
  createdById: string;
  options: BackupRequestOptions;
  stats: Record<string, number>;
  tables: string[];
  secretsExcluded: string[];
  notes: string[];
}

export type BackupDataFiles = Record<string, unknown[]>;

/** Maps legacy `content` and `full` to concrete export scopes */
export function normalizeBackupScopes(requested: string[]): BackupScope[] {
  const expanded = new Set<BackupScope>();

  for (const raw of requested) {
    if (raw === LEGACY_CONTENT_SCOPE) {
      CONTENT_SCOPES.forEach((c) => expanded.add(c));
      continue;
    }
    if (raw === 'full') {
      return resolveScopes(['full']);
    }
    if (isBackupScope(raw)) {
      expanded.add(raw);
    }
  }

  return [...expanded];
}

export function resolveScopes(requested: BackupScope[]): BackupScope[] {
  if (requested.includes('full')) {
    return SELECTABLE_BACKUP_SCOPES.slice();
  }
  return normalizeBackupScopes(requested);
}

export function isBackupScope(s: string): s is BackupScope {
  return (BACKUP_SCOPES as readonly string[]).includes(s);
}

export function isBackupAssetMode(s: string): s is BackupAssetMode {
  return (BACKUP_ASSET_MODES as readonly string[]).includes(s);
}

export function hasContentScope(scopes: BackupScope[]): boolean {
  return CONTENT_SCOPES.some((c) => scopes.includes(c));
}
