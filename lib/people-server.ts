import 'server-only';

import { unstable_cache } from 'next/cache';
import type { Prisma, PrismaClient } from '@prisma/client';
import { dbQuery } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { publicItemWhere, publicListWhere } from '@/lib/public-content-filters';
import { resolveItemDisplayImage } from '@/lib/resolve-item-image';
import { getPersonProfile, personPageCacheTag } from '@/lib/person-profiles-server';
import {
  buildPersonBioStub,
  extractPersonNamesFromMetadata,
  mergeItemMetadata,
  nameMatchesSlug,
  PERSON_ROLE_META,
  type PersonPageData,
  type PersonPageItem,
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

  const profile = await getPersonProfile(client, role, slug);
  const roleLabel = PERSON_ROLE_META[role].label;
  const publishedProfile = profile?.status === 'published' ? profile : null;

  const finalDisplayName = publishedProfile?.displayName ?? displayName;
  const bio =
    publishedProfile?.bio?.trim() ||
    buildPersonBioStub(role, matched.length, roleLabel);
  const bioIsStub = !publishedProfile?.bio?.trim();
  const imageUrl = publishedProfile?.imageUrl ?? null;
  const externalUrl = publishedProfile?.externalUrl ?? null;

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
    displayName: finalDisplayName,
    bio,
    bioIsStub,
    imageUrl,
    externalUrl,
    items,
  };
}

export function getCachedPersonPage(role: PersonRole, slug: string) {
  return unstable_cache(
    () => dbQuery(() => resolvePersonPage(prisma, role, slug)),
    [`person-page-${role}-${slug}`],
    { revalidate: 120, tags: [personPageCacheTag(role, slug), 'person-pages'] }
  )();
}
