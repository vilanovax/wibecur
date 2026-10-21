export const MEDIA_KINDS = [
  'banner',
  'category',
  'list',
  'list-banner',
  'catalog',
  'item',
  'person',
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export type MediaFilter = 'all' | MediaKind;

export type MediaState = 'all' | 'active' | 'inactive';

export const HEAVIEST_IMAGE_LIMIT = 25;

export type MediaSlot = {
  key: string;
  kind: MediaKind;
  id: string;
  title: string;
  detail: string;
  imageUrl: string | null;
  previewUrl: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  active: boolean;
  canClear: boolean;
  editHref: string | null;
};

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  banner: 'بنر سایت',
  category: 'دسته',
  list: 'کاور لیست',
  'list-banner': 'بنر لیست',
  catalog: 'کاتالوگ',
  item: 'آیتم',
  person: 'شخص',
};

const KIND_SET = new Set<string>(MEDIA_KINDS);

export function isMediaKind(value: string): value is MediaKind {
  return KIND_SET.has(value);
}

export function parseMediaFilter(value: string | undefined): MediaFilter {
  if (value === 'all' || value == null || value === '') return 'all';
  return isMediaKind(value) ? value : 'all';
}

export function parseMediaState(value: string | null | undefined): MediaState {
  if (value === 'active' || value === 'inactive') return value;
  return 'all';
}

export function parseMediaRank(value: string | null | undefined): 'bytes' | null {
  return value === 'bytes' ? 'bytes' : null;
}

/** تصویر یکتا با بیشترین حجم. نشانی تکراری یک بار می‌ماند. */
export function rankHeaviestImages<T extends { url: string; bytes: number }>(
  rows: T[],
  limit = HEAVIEST_IMAGE_LIMIT,
): T[] {
  const byUrl = new Map<string, T>();
  for (const row of rows) {
    const url = row.url.trim();
    if (!url || !(row.bytes > 0) || byUrl.has(url)) continue;
    byUrl.set(url, row);
  }
  return [...byUrl.values()]
    .sort((a, b) => b.bytes - a.bytes || a.url.localeCompare(b.url))
    .slice(0, limit);
}

/** کلید ایمپورت برای ردیفی که تصویر ندارد. بنر ثابت در JSON نمی‌آید. */
export function missingMediaTarget(kind: MediaKind, id: string, detail: string): string | null {
  if (kind === 'banner') return null;
  if (kind === 'person') {
    const slash = detail.indexOf('/');
    if (slash <= 0 || slash === detail.length - 1) return null;
    const role = detail.slice(0, slash).trim();
    const slug = detail.slice(slash + 1).trim();
    if (!safeTargetPart(role) || !safeTargetPart(slug)) return null;
    return `person:${role}:${slug}`;
  }
  if (kind === 'catalog' || kind === 'item') {
    const clean = id.trim();
    if (!safeTargetPart(clean)) return null;
    return `${kind}:${clean}`;
  }
  const slug = detail.trim();
  if (!safeTargetPart(slug)) return null;
  return `${kind}:${slug}`;
}

function safeTargetPart(value: string): boolean {
  return Boolean(value) && !value.includes(':') && !value.includes('/') && !value.includes('..') && !value.includes('\\');
}

export type MediaTarget =
  | { kind: 'category'; id: string }
  | { kind: 'list'; id: string }
  | { kind: 'list-banner'; id: string }
  | { kind: 'catalog'; id: string }
  | { kind: 'item'; id: string }
  | { kind: 'person'; role: string; slug: string };

/** `category:cafe`، `list-banner:slug`، `person:author:bozorg-alavi` */
export function parseMediaTarget(raw: string): MediaTarget | null {
  const value = raw.trim();
  const colon = value.indexOf(':');
  if (colon <= 0) return null;
  const kind = value.slice(0, colon);
  const rest = value.slice(colon + 1).trim();
  if (!rest || rest.includes('..') || rest.includes('/') || rest.includes('\\')) return null;

  if (kind === 'person') {
    const slash = rest.indexOf(':');
    if (slash <= 0 || slash === rest.length - 1) return null;
    const role = rest.slice(0, slash).trim();
    const slug = rest.slice(slash + 1).trim();
    if (!role || !slug) return null;
    return { kind: 'person', role, slug };
  }

  if (
    kind === 'category' ||
    kind === 'list' ||
    kind === 'list-banner' ||
    kind === 'catalog' ||
    kind === 'item'
  ) {
    return { kind, id: rest };
  }

  return null;
}

export type MediaAssignment = { target: string; url: string };

export function parseMediaImport(body: unknown): MediaAssignment[] | { error: string } {
  const record = Array.isArray(body) ? { assignments: body } : body;
  if (!record || typeof record !== 'object') {
    return { error: 'JSON باید یک شیء با آرایهٔ assignments باشد.' };
  }
  const assignments = (record as { assignments?: unknown }).assignments;
  if (!Array.isArray(assignments)) {
    return { error: 'فیلد assignments باید آرایه باشد.' };
  }
  if (assignments.length === 0) return { error: 'هیچ نسبتی در فایل نیست.' };
  if (assignments.length > 30) return { error: 'در هر بار حداکثر ۳۰ نسبت بفرستید.' };

  const parsed: MediaAssignment[] = [];
  for (const row of assignments) {
    if (!row || typeof row !== 'object') return { error: 'یکی از ردیف‌ها شیء نیست.' };
    const target = (row as { target?: unknown }).target;
    const url = (row as { url?: unknown }).url;
    if (typeof target !== 'string' || typeof url !== 'string') {
      return { error: 'هر ردیف باید target و url متنی داشته باشد.' };
    }
    if (!parseMediaTarget(target)) {
      return { error: `هدف نامعتبر است: ${target}` };
    }
    const trimmed = url.trim();
    if (!trimmed || trimmed.length > 2000) return { error: `آدرس نامعتبر است: ${target}` };
    parsed.push({ target: target.trim(), url: trimmed });
  }
  return parsed;
}

/** فقط نام فایل بنر موجود، بدون مسیر. */
export function safeBannerFileName(name: string): string | null {
  const base = name.trim();
  if (!/^[a-z0-9][a-z0-9.-]*\.webp$/i.test(base)) return null;
  if (base.includes('..') || base.includes('/') || base.includes('\\')) return null;
  return base;
}
