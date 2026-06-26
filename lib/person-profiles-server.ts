import 'server-only';

import { revalidateTag } from 'next/cache';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { publicItemWhere, publicListWhere } from '@/lib/public-content-filters';
import {
  extractPersonNamesFromMetadata,
  mergeItemMetadata,
  personSlug,
  type PersonRole,
  PERSON_ROLES,
} from '@/lib/people';
import type {
  DiscoveredPerson,
  DiscoverPeopleResult,
  PersonProfileRecord,
  PersonProfileStatus,
} from '@/lib/person-profiles';

export function personPageCacheTag(role: PersonRole, slug: string): string {
  return `person-${role}-${slug}`;
}

export function revalidatePersonPageCache(role: PersonRole, slug: string): void {
  revalidateTag(personPageCacheTag(role, slug), 'max');
  revalidateTag('person-pages', 'max');
}

export async function getPersonProfile(
  client: PrismaClient,
  role: PersonRole,
  slug: string
): Promise<PersonProfileRecord | null> {
  const row = await client.person_profiles.findUnique({
    where: { role_slug: { role, slug } },
  });
  if (!row) return null;
  return row as PersonProfileRecord;
}

export async function upsertPersonProfile(
  client: PrismaClient,
  data: {
    role: PersonRole;
    slug: string;
    displayName: string;
    bio?: string | null;
    imageUrl?: string | null;
    tmdbId?: number | null;
    externalUrl?: string | null;
    status?: PersonProfileStatus;
  }
): Promise<PersonProfileRecord> {
  const row = await client.person_profiles.upsert({
    where: { role_slug: { role: data.role, slug: data.slug } },
    create: {
      role: data.role,
      slug: data.slug,
      displayName: data.displayName.trim(),
      bio: data.bio?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      tmdbId: data.tmdbId ?? null,
      externalUrl: data.externalUrl?.trim() || null,
      status: data.status ?? 'published',
    },
    update: {
      displayName: data.displayName.trim(),
      ...(data.bio !== undefined && { bio: data.bio?.trim() || null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl?.trim() || null }),
      ...(data.tmdbId !== undefined && { tmdbId: data.tmdbId }),
      ...(data.externalUrl !== undefined && { externalUrl: data.externalUrl?.trim() || null }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  revalidatePersonPageCache(data.role, data.slug);
  return row as PersonProfileRecord;
}

/** کشف اشخاص از metadata آیتم‌های منتشرشده */
export async function discoverPeopleFromItems(
  client: PrismaClient = prisma,
  options?: {
    role?: PersonRole;
    q?: string;
    limit?: number;
    page?: number;
    missingBioOnly?: boolean;
  }
): Promise<DiscoverPeopleResult> {
  const rows = await client.items.findMany({
    where: {
      ...publicItemWhere,
      lists: publicListWhere,
    },
    select: {
      id: true,
      metadata: true,
      catalog_items: { select: { metadata: true } },
    },
    take: 5000,
  });

  const map = new Map<
    string,
    { role: PersonRole; slug: string; displayName: string; itemIds: Set<string> }
  >();

  for (const row of rows) {
    const merged = mergeItemMetadata(row.metadata, row.catalog_items?.metadata);
    const roles = options?.role ? [options.role] : PERSON_ROLES;

    for (const role of roles) {
      const names = extractPersonNamesFromMetadata(merged, role);
      for (const name of names) {
        const slug = personSlug(name);
        const key = `${role}:${slug}`;
        const existing = map.get(key);
        if (existing) {
          existing.itemIds.add(row.id);
        } else {
          map.set(key, {
            role,
            slug,
            displayName: name.trim(),
            itemIds: new Set([row.id]),
          });
        }
      }
    }
  }

  const profiles = await client.person_profiles.findMany({
    where: options?.role ? { role: options.role } : undefined,
    select: { role: true, slug: true, status: true, bio: true },
  });
  const profileMap = new Map(
    profiles.map((p) => [
      `${p.role}:${p.slug}`,
      {
        status: p.status as PersonProfileStatus,
        hasBio: Boolean(p.bio?.trim()),
      },
    ])
  );

  let discovered: DiscoveredPerson[] = Array.from(map.values()).map((entry) => {
    const key = `${entry.role}:${entry.slug}`;
    const profile = profileMap.get(key);
    const status = profile?.status ?? null;
    return {
      role: entry.role,
      slug: entry.slug,
      displayName: entry.displayName,
      itemCount: entry.itemIds.size,
      hasProfile: status != null,
      hasBio: profile?.hasBio ?? false,
      profileStatus: status,
    };
  });

  const q = options?.q?.trim().toLowerCase();
  if (q) {
    discovered = discovered.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        p.slug.includes(q.replace(/\s+/g, '-'))
    );
  }

  const stats = {
    total: discovered.length,
    withBio: discovered.filter((p) => p.hasBio).length,
    withProfile: discovered.filter((p) => p.hasProfile).length,
    missingBio: discovered.filter((p) => !p.hasBio).length,
  };

  if (options?.missingBioOnly) {
    discovered = discovered.filter((p) => !p.hasBio);
  }

  discovered.sort((a, b) => b.itemCount - a.itemCount || a.displayName.localeCompare(b.displayName));

  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
  const page = Math.max(options?.page ?? 1, 1);
  const total = discovered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    people: discovered.slice(start, start + limit),
    stats,
    pagination: { page: safePage, limit, total, totalPages },
  };
}
