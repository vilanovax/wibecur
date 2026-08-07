import 'server-only';

import { revalidateTag } from 'next/cache';
import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidateAdminPeopleCache } from '@/lib/admin/admin-cache';
import { queryCachedDiscoveredPeople } from '@/lib/admin/person-discovery-cached';
import { findBestProfileForDiscoveredEntry, extractImdbNameId, type PersonRole } from '@/lib/people';
import type {
  DiscoverPeopleResult,
  PersonProfileRecord,
  PersonProfileStatus,
} from '@/lib/person-profiles';

export { buildDiscoveredPeopleList } from '@/lib/person-discovery-build';

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

/** پروفایل با تطبیق انعطاف‌پذیر slug — برای import با slug متفاوت از کشف آیتم‌ها */
export async function getPersonProfileFlexible(
  client: PrismaClient,
  role: PersonRole,
  slug: string,
  displayName?: string
): Promise<PersonProfileRecord | null> {
  const candidates = await client.person_profiles.findMany({ where: { role } });
  const best = findBestProfileForDiscoveredEntry(
    { role, slug, displayName: displayName?.trim() || slug },
    candidates.map((p) => ({
      role: p.role as PersonRole,
      slug: p.slug,
      displayName: p.displayName,
      bio: p.bio,
      externalUrl: p.externalUrl,
      status: p.status as PersonProfileStatus,
    }))
  );
  if (!best) return null;
  const row = candidates.find((p) => p.role === best.role && p.slug === best.slug);
  return row ? (row as PersonProfileRecord) : null;
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
  revalidateAdminPeopleCache();
  return row as PersonProfileRecord;
}

/** قبل از import — IMDb تکراری روی slug دیگر را پاک می‌کند (مثلاً Jamie روی geena-davis) */
export async function clearImdbUrlConflictsForImport(
  client: PrismaClient,
  role: PersonRole,
  slug: string,
  externalUrl: string | null | undefined
): Promise<number> {
  const imdbId = extractImdbNameId(externalUrl);
  if (!imdbId) return 0;

  const conflicts = await client.person_profiles.findMany({
    where: {
      role,
      slug: { not: slug },
      externalUrl: { contains: `nm${imdbId}` },
    },
    select: { role: true, slug: true },
  });

  for (const conflict of conflicts) {
    await client.person_profiles.update({
      where: { role_slug: { role: conflict.role, slug: conflict.slug } },
      data: { externalUrl: null },
    });
    revalidatePersonPageCache(conflict.role as PersonRole, conflict.slug);
  }

  return conflicts.length;
}

/** کشف اشخاص از metadata آیتم‌های منتشرشده — با کش ۱۲۰ ثانیه‌ای */
export async function discoverPeopleFromItems(
  _client: PrismaClient = prisma,
  options?: {
    role?: PersonRole;
    q?: string;
    limit?: number;
    page?: number;
    missingBioOnly?: boolean;
    skipPagination?: boolean;
  }
): Promise<DiscoverPeopleResult> {
  return queryCachedDiscoveredPeople(options);
}
