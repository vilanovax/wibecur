import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import type { Prisma, PrismaClient } from '@prisma/client';
import { dbQuery } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { personNamesLikelySamePerson } from '@/lib/person-spelling';
import { getCachedDiscoveredPeople, peekPersonItemIds } from '@/lib/admin/person-discovery-cached';
import { publicItemWhere, publicListWhere } from '@/lib/public-content-filters';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import { getPersonProfileFlexible, personPageCacheTag } from '@/lib/person-profiles-server';
import { matchPublicPersonHrefs } from '@/lib/person-hrefs';
import {
  buildPersonBioStub,
  extractPersonNamesFromMetadata,
  isPersonRole,
  mergeItemMetadata,
  nameMatchesSlug,
  personItemDedupeKey,
  PERSON_ROLE_META,
  type PersonPageData,
  type PersonPageItem,
  type PersonProfileIdentity,
  type PersonRole,
} from '@/lib/people';

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

function personNamesOnItem(
  item: {
    metadata: unknown;
    catalog_items: { metadata: unknown } | null;
  },
  role: PersonRole
): string[] {
  const merged = mergeItemMetadata(item.metadata, item.catalog_items?.metadata);
  return extractPersonNamesFromMetadata(merged, role);
}

function itemMatchesPerson(
  item: {
    metadata: unknown;
    catalog_items: { metadata: unknown } | null;
  },
  role: PersonRole,
  slug: string
): boolean {
  return personNamesOnItem(item, role).some((name) => nameMatchesSlug(name, slug));
}

/** املاهای نزدیک همان شخص — «جرد دایموند» و «جارد دایموند» — را هم به صفحه می‌آورد. */
function expandSpellingVariants<T extends { metadata: unknown; catalog_items: { metadata: unknown } | null }>(
  rows: T[],
  role: PersonRole,
  slug: string
): T[] {
  const anchors = new Set<string>();
  for (const row of rows) {
    for (const name of personNamesOnItem(row, role)) {
      if (nameMatchesSlug(name, slug)) anchors.add(name);
    }
  }
  const anchorList = [...anchors];
  if (anchorList.length === 0) {
    return rows.filter((row) => itemMatchesPerson(row, role, slug));
  }

  return rows.filter((row) =>
    personNamesOnItem(row, role).some(
      (name) =>
        nameMatchesSlug(name, slug) ||
        anchorList.some((anchor) => personNamesLikelySamePerson(name, anchor))
    )
  );
}

/**
 * وقتی جستجوی slug در metadata چیزی پیدا نکند.
 * نام فارسی به اسلاگ لاتین (bzrg-aloi) تبدیل می‌شود و داخل فیلد نویسنده نیست؛
 * بازیگر هم اغلب آرایهٔ JSON است و string_contains آن را نمی‌بیند.
 * سقف با اسکن کشف اشخاص یکی است تا آیتم جا نماند.
 */
const PERSON_ITEM_SCAN_LIMIT = 5000;

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

async function loadItemsByIds(
  client: PrismaClient,
  role: PersonRole,
  slug: string,
  ids: string[]
): Promise<PersonItemRow[]> {
  const rows = await client.items.findMany({
    where: {
      id: { in: ids },
      ...publicItemWhere,
      lists: publicListWhere,
    },
    select: personItemSelect,
  });
  if (rows.length === 0) return [];
  const expanded = expandSpellingVariants(rows, role, slug);
  return expanded.length > 0 ? expanded : rows;
}

async function findPublicItemsForPerson(
  client: PrismaClient,
  role: PersonRole,
  slug: string
): Promise<PersonItemRow[]> {
  const knownIds = peekPersonItemIds(role, slug);
  if (knownIds) {
    const indexed = await loadItemsByIds(client, role, slug, knownIds);
    if (indexed.length > 0) return indexed;
  }

  const pattern = slugToSearchPattern(slug);
  if (!pattern) return [];

  // مسیر سریع — نام لاتین عین اسلاگ داخل metadata است. نام فارسی این‌جا صفر برمی‌گرداند.
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
  if (fastMatches.length > 0) {
    return fastMatches;
  }

  await getCachedDiscoveredPeople();
  const warmedIds = peekPersonItemIds(role, slug);
  if (warmedIds) {
    const indexed = await loadItemsByIds(client, role, slug, warmedIds);
    if (indexed.length > 0) return indexed;
  }

  const scanned = await client.items.findMany({
    where: {
      ...publicItemWhere,
      lists: publicListWhere,
    },
    select: personItemSelect,
    take: PERSON_ITEM_SCAN_LIMIT,
  });

  return expandSpellingVariants(scanned, role, slug);
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
    [`person-page-v2-${role}-${slug}`],
    { revalidate: 120, tags: [personPageCacheTag(role, slug), 'person-pages'] }
  )()
);

/**
 * پروفایل‌های منتشرشده — یک کوئری کش‌شده.
 * صفحهٔ لیست قبلاً برای هر نویسنده `resolvePersonPage` می‌زد و در بدترین حالت
 * هزاران آیتم را اسکن می‌کرد؛ لینک فقط به بیوی منتشرشده نیاز دارد.
 */
const loadPublishedPersonProfiles = unstable_cache(
  async () => {
    const rows = await dbQuery(() =>
      prisma.person_profiles.findMany({
        where: { status: 'published' },
        select: {
          role: true,
          slug: true,
          displayName: true,
          bio: true,
          externalUrl: true,
          status: true,
        },
      })
    );
    return rows;
  },
  ['published-person-profiles-v1'],
  { revalidate: 300, tags: ['person-pages'] }
);

/**
 * لینک صفحهٔ شخص فقط برای پروفایل منتشرشده با بیو.
 * اسکن آیتم‌ها اینجا انجام نمی‌شود؛ خود صفحهٔ شخص هنگام باز شدن آن را می‌سازد.
 */
export async function resolvePublicPersonHrefs(
  targets: Array<{ role: PersonRole; name: string }>
): Promise<Record<string, string>> {
  if (targets.length === 0) return {};

  const rows = await loadPublishedPersonProfiles();
  const profiles: PersonProfileIdentity[] = [];
  for (const row of rows) {
    if (!isPersonRole(row.role) || !row.bio?.trim()) continue;
    profiles.push({
      role: row.role,
      slug: row.slug,
      displayName: row.displayName,
      bio: row.bio,
      externalUrl: row.externalUrl,
      status: 'published',
    });
  }

  return matchPublicPersonHrefs(targets, profiles);
}
