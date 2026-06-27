import { unstable_cache } from 'next/cache';
import { dbQuery } from '@/lib/db';
import type { PersonRole } from '@/lib/people';
import type {
  DiscoveredPerson,
  DiscoverPeopleResult,
  DiscoverPeopleStats,
} from '@/lib/person-profiles';
import { buildDiscoveredPeopleList } from '@/lib/person-discovery-build';

export const ADMIN_PEOPLE_CACHE_SECONDS = 300;
export const ADMIN_PEOPLE_CACHE_TAG = 'admin-people-discovery';

async function loadAllDiscoveredPeople(): Promise<DiscoveredPerson[]> {
  return buildDiscoveredPeopleList();
}

export function getCachedDiscoveredPeople(): Promise<DiscoveredPerson[]> {
  return unstable_cache(
    () => dbQuery(loadAllDiscoveredPeople),
    ['admin-people-discovery-v4'],
    {
      revalidate: ADMIN_PEOPLE_CACHE_SECONDS,
      tags: [ADMIN_PEOPLE_CACHE_TAG],
    }
  )();
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
