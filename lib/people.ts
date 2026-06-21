import { unstable_cache } from 'next/cache';
import type { Prisma, PrismaClient } from '@prisma/client';
import { slugifyCategoryName } from '@/lib/admin/category-slug';
import { dbQuery } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { publicItemWhere, publicListWhere } from '@/lib/public-content-filters';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';

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

function mergeItemMetadata(
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

function slugToSearchPattern(slug: string): string {
  return slug.replace(/-/g, ' ').trim();
}

function metadataContains(path: string[], term: string): Prisma.JsonFilter {
  return {
    path,
    string_contains: term,
    mode: 'insensitive',
  };
}

function buildPersonSearchWhere(role: PersonRole, pattern: string): Prisma.itemsWhereInput[] {
  const key = PERSON_ROLE_META[role].metadataKey;
  const clauses: Prisma.itemsWhereInput[] = [
    { metadata: metadataContains([key], pattern) },
    {
      catalog_items: {
        is: { metadata: metadataContains([key], pattern) },
      },
    },
  ];

  if (role === 'translator') {
    clauses.push({ metadata: metadataContains(['tip'], pattern) });
  }

  return clauses;
}

function itemMatchesPerson(
  item: {
    metadata: unknown;
    catalog_items: { metadata: unknown } | null;
  },
  role: PersonRole,
  slug: string
): boolean {
  const merged = mergeItemMetadata(item.metadata, item.catalog_items?.metadata);
  const names = extractPersonNamesFromMetadata(merged, role);
  return names.some((name) => nameMatchesSlug(name, slug));
}

export async function resolvePersonPage(
  client: PrismaClient,
  role: PersonRole,
  slug: string
): Promise<PersonPageData | null> {
  const pattern = slugToSearchPattern(slug);
  if (!pattern) return null;

  const rows = await client.items.findMany({
    where: {
      ...publicItemWhere,
      lists: publicListWhere,
      OR: buildPersonSearchWhere(role, pattern),
    },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      rating: true,
      metadata: true,
      catalog_items: { select: { metadata: true } },
      lists: {
        select: {
          slug: true,
          categories: { select: { slug: true, icon: true } },
        },
      },
    },
    orderBy: [{ title: 'asc' }],
    take: 250,
  });

  const matched = rows.filter((row) => itemMatchesPerson(row, role, slug));
  if (matched.length === 0) return null;

  const displayName =
    extractPersonNamesFromMetadata(
      mergeItemMetadata(matched[0].metadata, matched[0].catalog_items?.metadata),
      role
    ).find((name) => nameMatchesSlug(name, slug)) ?? slugToSearchPattern(slug);

  const seen = new Set<string>();
  const items: PersonPageItem[] = [];

  for (const row of matched) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);

    const metadata = mergeItemMetadata(row.metadata, row.catalog_items?.metadata);
    const categorySlug = row.lists.categories?.slug ?? null;

    items.push({
      id: row.id,
      title: row.title,
      imageUrl: row.imageUrl,
      displayImageUrl: resolveItemDisplayImage({
        id: row.id,
        imageUrl: row.imageUrl,
        title: row.title,
        metadata,
        categorySlug,
      }),
      categorySlug,
      categoryIcon: row.lists.categories?.icon ?? null,
      listSlug: row.lists.slug,
      rating: row.rating,
    });
  }

  return {
    role,
    slug,
    displayName,
    items,
  };
}

export function getCachedPersonPage(role: PersonRole, slug: string) {
  return unstable_cache(
    () => dbQuery(() => resolvePersonPage(prisma, role, slug)),
    [`person-page-${role}-${slug}`],
    { revalidate: 120, tags: [`person-${role}-${slug}`, 'person-pages'] }
  )();
}
