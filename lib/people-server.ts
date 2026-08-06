import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import type { Prisma, PrismaClient } from '@prisma/client';
import { dbQuery } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { publicItemWhere, publicListWhere } from '@/lib/public-content-filters';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import { getPersonProfileFlexible, personPageCacheTag } from '@/lib/person-profiles-server';
import {
  buildPersonBioStub,
  extractPersonNamesFromMetadata,
  mergeItemMetadata,
  nameMatchesSlug,
  personItemDedupeKey,
  PERSON_ROLE_META,
  type PersonPageData,
  type PersonPageItem,
  type PersonRole,
} from '@/lib/people';

/** Roles whose metadata is often a JSON array — string_contains misses them. */
const ARRAYISH_PERSON_ROLES: ReadonlySet<PersonRole> = new Set(['actor']);

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

/** Fallback scan cap — only for arrayish roles; keep small for TTFB. */
const PERSON_ITEM_SCAN_LIMIT = 1200;

const personItemSelect = {
  id: true,
  title: true,
  catalogItemId: true,
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
} as const;

type PersonItemRow = {
  id: string;
  title: string;
  catalogItemId: string | null;
  imageUrl: string | null;
  rating: number | null;
  metadata: unknown;
  catalog_items: { metadata: unknown } | null;
  lists: {
    slug: string;
    categories: { slug: string; icon: string | null } | null;
  };
};

async function findPublicItemsForPerson(
  client: PrismaClient,
  role: PersonRole,
  slug: string
): Promise<PersonItemRow[]> {
  const pattern = slugToSearchPattern(slug);
  if (!pattern) return [];

  // مسیر سریع — برای director/author که metadata رشته‌ای است
  const filtered = await client.items.findMany({
    where: {
      ...publicItemWhere,
      lists: publicListWhere,
      OR: buildPersonSearchWhere(role, pattern),
    },
    select: personItemSelect,
    orderBy: [{ title: 'asc' }],
    take: 500,
  });

  const fastMatches = filtered.filter((row) => itemMatchesPerson(row, role, slug));
  if (fastMatches.length > 0 || !ARRAYISH_PERSON_ROLES.has(role)) {
    return fastMatches;
  }

  // fallback: اسکن محدود — فقط برای actor که metadata اغلب JSON array است
  const scanned = await client.items.findMany({
    where: {
      ...publicItemWhere,
      lists: publicListWhere,
    },
    select: personItemSelect,
    take: PERSON_ITEM_SCAN_LIMIT,
  });

  return scanned.filter((row) => itemMatchesPerson(row, role, slug));
}

export async function resolvePersonPage(
  client: PrismaClient,
  role: PersonRole,
  slug: string,
  options?: { forAdmin?: boolean }
): Promise<PersonPageData | null> {
  const matched = await findPublicItemsForPerson(client, role, slug);
  if (matched.length === 0) return null;

  const displayName =
    extractPersonNamesFromMetadata(
      mergeItemMetadata(matched[0].metadata, matched[0].catalog_items?.metadata),
      role
    ).find((name) => nameMatchesSlug(name, slug)) ?? slugToSearchPattern(slug);

  const profile = await getPersonProfileFlexible(client, role, slug, displayName);
  const roleLabel = PERSON_ROLE_META[role].label;
  const profileForDisplay =
    options?.forAdmin || profile?.status === 'published' ? profile : null;

  const finalDisplayName = profileForDisplay?.displayName ?? displayName;

  const seen = new Set<string>();
  const items: PersonPageItem[] = [];

  for (const row of matched) {
    const dedupeKey = personItemDedupeKey(row);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

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

  const bioIsStub = !profileForDisplay?.bio?.trim();
  const finalBio =
    profileForDisplay?.bio?.trim() ||
    buildPersonBioStub(role, items.length, roleLabel);

  return {
    role,
    slug,
    displayName: finalDisplayName,
    bio: finalBio,
    bioIsStub,
    imageUrl: profileForDisplay?.imageUrl ?? null,
    externalUrl: profileForDisplay?.externalUrl ?? null,
    profileStatus: profile?.status ?? null,
    items,
  };
}

export const getCachedPersonPage = cache((role: PersonRole, slug: string) =>
  unstable_cache(
    () => dbQuery(() => resolvePersonPage(prisma, role, slug)),
    [`person-page-${role}-${slug}`],
    { revalidate: 120, tags: [personPageCacheTag(role, slug), 'person-pages'] }
  )()
);
