import 'server-only';

import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { publicItemWhere, publicListWhere } from '@/lib/public-content-filters';
import {
  buildProfileLookup,
  extractPersonNamesFromMetadata,
  findBestProfileForDiscoveredEntry,
  isLatinPersonSlug,
  mergeDiscoveredPersonEntries,
  mergeItemMetadata,
  personItemDedupeKey,
  personSlug,
  type DiscoveredPersonEntry,
  type PersonProfileIdentity,
  type PersonRole,
  PERSON_ROLES,
} from '@/lib/people';
import type { DiscoveredPerson, PersonProfileStatus } from '@/lib/person-profiles';

function buildItemKeyToLatinKeys(
  mergedEntries: DiscoveredPersonEntry[]
): Map<string, Set<string>> {
  const itemKeyToLatinKeys = new Map<string, Set<string>>();
  for (const entry of mergedEntries) {
    if (!isLatinPersonSlug(entry.slug)) continue;
    const entryKey = `${entry.role}:${entry.slug}`;
    for (const itemKey of entry.itemKeys) {
      const keys = itemKeyToLatinKeys.get(itemKey) ?? new Set<string>();
      keys.add(entryKey);
      itemKeyToLatinKeys.set(itemKey, keys);
    }
  }
  return itemKeyToLatinKeys;
}

function shouldShowDiscoveredEntry(
  entry: DiscoveredPerson,
  mergedEntry: DiscoveredPersonEntry | undefined,
  profile: PersonProfileIdentity | undefined,
  itemKeyToLatinKeys: Map<string, Set<string>>,
  latinKeysInDiscovery: Set<string>
): boolean {
  if (isLatinPersonSlug(entry.slug)) return true;
  if (!mergedEntry) return true;
  const entryKey = `${entry.role}:${entry.slug}`;

  for (const itemKey of mergedEntry.itemKeys) {
    const latinKeys = itemKeyToLatinKeys.get(itemKey);
    if (!latinKeys?.size) continue;
    for (const latinKey of latinKeys) {
      if (latinKey.startsWith(`${entry.role}:`) && latinKey !== entryKey && latinKeysInDiscovery.has(latinKey)) {
        return false;
      }
    }
  }

  if (profile?.bio?.trim()) return false;

  const profileKey = profile ? `${entry.role}:${profile.slug}` : null;
  if (profileKey && isLatinPersonSlug(profile.slug) && latinKeysInDiscovery.has(profileKey)) {
    return false;
  }

  return true;
}

/** اسکن کامل metadata آیتم‌ها — فقط برای rebuild کش */
export async function buildDiscoveredPeopleList(
  client: PrismaClient = prisma
): Promise<DiscoveredPerson[]> {
  const [rows, profiles] = await Promise.all([
    client.items.findMany({
      where: {
        ...publicItemWhere,
        lists: publicListWhere,
      },
      select: {
        id: true,
        title: true,
        catalogItemId: true,
        metadata: true,
        catalog_items: { select: { metadata: true } },
      },
      take: 5000,
    }),
    client.person_profiles.findMany({
      select: {
        role: true,
        slug: true,
        status: true,
        bio: true,
        displayName: true,
        externalUrl: true,
      },
    }),
  ]);

  const map = new Map<
    string,
    { role: PersonRole; slug: string; displayName: string; itemKeys: Set<string> }
  >();

  for (const row of rows) {
    const merged = mergeItemMetadata(row.metadata, row.catalog_items?.metadata);
    const itemKey = personItemDedupeKey(row);

    for (const role of PERSON_ROLES) {
      const names = extractPersonNamesFromMetadata(merged, role);
      for (const name of names) {
        const slug = personSlug(name);
        const key = `${role}:${slug}`;
        const existing = map.get(key);
        if (existing) {
          existing.itemKeys.add(itemKey);
        } else {
          map.set(key, {
            role,
            slug,
            displayName: name.trim(),
            itemKeys: new Set([itemKey]),
          });
        }
      }
    }
  }

  const profileIdentities = profiles.map((p) => ({
    role: p.role as PersonRole,
    slug: p.slug,
    displayName: p.displayName,
    bio: p.bio,
    externalUrl: p.externalUrl,
    status: p.status as PersonProfileStatus,
  }));
  const profileLookup = buildProfileLookup(profileIdentities);
  const rawEntries = Array.from(map.values());

  const mergedEntries = mergeDiscoveredPersonEntries(rawEntries, profileIdentities);
  const mergedEntryBySlug = new Map(
    mergedEntries.map((entry) => [`${entry.role}:${entry.slug}`, entry] as const)
  );
  const itemKeyToLatinKeys = buildItemKeyToLatinKeys(mergedEntries);
  const latinKeysInDiscovery = new Set(
    mergedEntries
      .filter((entry) => isLatinPersonSlug(entry.slug))
      .map((entry) => `${entry.role}:${entry.slug}`)
  );

  const profileByEntryKey = new Map<string, PersonProfileIdentity | undefined>();
  for (const entry of mergedEntries) {
    profileByEntryKey.set(
      `${entry.role}:${entry.slug}`,
      findBestProfileForDiscoveredEntry(entry, profileLookup)
    );
  }

  const discovered: DiscoveredPerson[] = mergedEntries.map((entry) => {
    const profile = profileByEntryKey.get(`${entry.role}:${entry.slug}`);
    return {
      role: entry.role,
      slug: entry.slug,
      displayName: entry.displayName,
      itemCount: entry.itemKeys.size,
      hasProfile: profile != null,
      hasBio: Boolean(profile?.bio?.trim()),
      profileStatus: profile?.status ?? null,
    };
  });

  const filtered = discovered.filter((entry) =>
    shouldShowDiscoveredEntry(
      entry,
      mergedEntryBySlug.get(`${entry.role}:${entry.slug}`),
      profileByEntryKey.get(`${entry.role}:${entry.slug}`),
      itemKeyToLatinKeys,
      latinKeysInDiscovery
    )
  );

  filtered.sort(
    (a, b) => b.itemCount - a.itemCount || a.displayName.localeCompare(b.displayName)
  );

  return filtered;
}
