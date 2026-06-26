import { slugifyCategoryName } from '@/lib/admin/category-slug';

export type PersonRole = 'director' | 'author' | 'translator' | 'actor';

export const PERSON_ROLE_META: Record<
  PersonRole,
  { label: string; pluralLabel: string; icon: string; metadataKey: string }
> = {
  director: { label: 'کارگردان', pluralLabel: 'کارگردان', icon: '🎬', metadataKey: 'director' },
  author: { label: 'نویسنده', pluralLabel: 'نویسنده', icon: '✍️', metadataKey: 'author' },
  translator: { label: 'مترجم', pluralLabel: 'مترجم', icon: '📖', metadataKey: 'translator' },
  actor: { label: 'بازیگر', pluralLabel: 'بازیگر', icon: '🎭', metadataKey: 'actors' },
};

export const PERSON_ROLES = Object.keys(PERSON_ROLE_META) as PersonRole[];

export type PersonPageItem = {
  id: string;
  title: string;
  imageUrl: string | null;
  displayImageUrl: string;
  categorySlug: string | null;
  categoryIcon: string | null;
  listSlug: string;
  rating: number | null;
};

export type PersonPageData = {
  role: PersonRole;
  slug: string;
  displayName: string;
  bio: string | null;
  bioIsStub: boolean;
  imageUrl: string | null;
  externalUrl: string | null;
  items: PersonPageItem[];
};

export function isPersonRole(value: string): value is PersonRole {
  return value in PERSON_ROLE_META;
}

/** slug یکتا برای URL — فارسی transliterate می‌شود */
export function personSlug(name: string): string {
  const base = slugifyCategoryName(name.trim());
  if (base && base !== 'category') return base;
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'person'
  );
}

export function personPagePath(role: PersonRole, name: string): string {
  return `/people/${role}/${personSlug(name)}`;
}

export function nameMatchesSlug(name: string, slug: string): boolean {
  return personSlug(name) === slug;
}

export function parseActorNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,،·]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function metaRecord(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mergeItemMetadata(
  itemMetadata: unknown,
  catalogMetadata: unknown
): Record<string, unknown> {
  return { ...metaRecord(catalogMetadata), ...metaRecord(itemMetadata) };
}

function extractTranslatorFromTip(metadata: Record<string, unknown>): string | null {
  const raw = metadata.tip;
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^مترجم\s*[:：]\s*(.+)$/u);
  return match?.[1]?.trim() || null;
}

/** نام‌های مرتبط با یک نقش از metadata ادغام‌شده */
export function extractPersonNamesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  role: PersonRole
): string[] {
  const meta = metaRecord(metadata);
  const key = PERSON_ROLE_META[role].metadataKey;

  if (role === 'actor') {
    return parseActorNames(meta.actors);
  }

  if (role === 'translator') {
    const names: string[] = [];
    const direct = meta.translator;
    if (typeof direct === 'string' && direct.trim()) names.push(direct.trim());
    const fromTip = extractTranslatorFromTip(meta);
    if (fromTip && !names.includes(fromTip)) names.push(fromTip);
    return names;
  }

  const raw = meta[key];
  if (typeof raw === 'string' && raw.trim()) return [raw.trim()];
  return [];
}

export function buildPersonBioStub(_role: PersonRole, itemCount: number, roleLabel: string): string {
  return `${roleLabel} · ${itemCount.toLocaleString('fa-IR')} آیتم در وایب`;
}
