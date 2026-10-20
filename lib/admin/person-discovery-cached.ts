import { unstable_cache } from 'next/cache';
import { dbQuery } from '@/lib/db';
import type { PersonProfileIdentity, PersonRole } from '@/lib/people';
import type {
  DiscoveredPerson,
  DiscoverPeopleResult,
  DiscoverPeopleStats,
} from '@/lib/person-profiles';
import { buildDiscoveredPeopleList } from '@/lib/person-discovery-build';
import { clearPersonProfileRowCache } from '@/lib/person-profiles-server';

export const ADMIN_PEOPLE_CACHE_SECONDS = 300;
export const ADMIN_PEOPLE_CACHE_TAG = 'admin-people-discovery';

type PeopleMemoryCache = {
  at: number;
  people: DiscoveredPerson[];
  itemIndex: Record<string, string[]>;
  profiles: PersonProfileIdentity[];
};

const peopleMemory = globalThis as typeof globalThis & {
  __adminPeopleDiscovery?: PeopleMemoryCache;
};

async function loadAllDiscoveredPeople() {
  return buildDiscoveredPeopleList();
}

export function clearAdminPeopleMemoryCache(): void {
  peopleMemory.__adminPeopleDiscovery = undefined;
  clearPersonProfileRowCache();
}

export async function getCachedDiscoveredPeople(): Promise<DiscoveredPerson[]> {
  const cached = peopleMemory.__adminPeopleDiscovery;
  if (
    cached?.profiles &&
    Date.now() - cached.at < ADMIN_PEOPLE_CACHE_SECONDS * 1000
  ) {
    return cached.people;
  }

  const built = await unstable_cache(
    () => dbQuery(loadAllDiscoveredPeople),
    ['admin-people-discovery-v7'],
    {
      revalidate: ADMIN_PEOPLE_CACHE_SECONDS,
      tags: [ADMIN_PEOPLE_CACHE_TAG],
    }
  )();

  peopleMemory.__adminPeopleDiscovery = {
    at: Date.now(),
    people: built.people,
    itemIndex: built.itemIndex,
    profiles: built.profiles,
  };
  return built.people;
}

export async function getCachedProfileIdentities(): Promise<PersonProfileIdentity[]> {
  await getCachedDiscoveredPeople();
  return peopleMemory.__adminPeopleDiscovery?.profiles ?? [];
}

/** شناسه‌های آیتم یک شخص، اگر کش کشف آماده باشد. */
export function peekPersonItemIds(role: string, slug: string): string[] | null {
  const ids = peopleMemory.__adminPeopleDiscovery?.itemIndex?.[`${role}:${slug}`];
  return ids?.length ? ids : null;
}

function computeStats(people: DiscoveredPerson[]): DiscoverPeopleStats {
  let withBio = 0;
  let withProfile = 0;
  for (const person of people) {
    if (person.hasBio) withBio += 1;
    if (person.hasProfile) withProfile += 1;
  }
  return {
    total: people.length,
    withBio,
    withProfile,
    missingBio: people.length - withBio,
  };
}

export async function queryCachedDiscoveredPeople(options?: {
  role?: PersonRole;
  q?: string;
  limit?: number;
  page?: number;
  missingBioOnly?: boolean;
  skipPagination?: boolean;
}): Promise<DiscoverPeopleResult> {
  let discovered = await getCachedDiscoveredPeople();

  if (options?.role) {
    discovered = discovered.filter((person) => person.role === options.role);
  }

  const q = options?.q?.trim().toLowerCase();
  if (q) {
    discovered = discovered.filter(
      (person) =>
        person.displayName.toLowerCase().includes(q) ||
        person.slug.includes(q.replace(/\s+/g, '-'))
    );
  }

  const stats = computeStats(discovered);

  if (options?.missingBioOnly) {
    discovered = discovered.filter((person) => !person.hasBio);
  }

  if (options?.skipPagination) {
    return {
      people: discovered,
      stats,
      pagination: {
        page: 1,
        limit: discovered.length,
        total: discovered.length,
        totalPages: 1,
      },
    };
  }

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
