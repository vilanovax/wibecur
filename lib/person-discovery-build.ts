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
  personIdentityMatches,
  personItemDedupeKey,
  personSlugTwoPartKey,
  personSlugsPrefixMatch,
  personSlug,
  type DiscoveredPersonEntry,
  type PersonProfileIdentity,
  type PersonRole,
  type ProfileLookup,
  PERSON_ROLES,
} from '@/lib/people';
import type { DiscoveredPerson, PersonProfileStatus } from '@/lib/person-profiles';
import { personImageStorageStatus } from '@/lib/person-image-utils';

/** تطبیق دسته‌ای: ایندکس‌ها و پیشوند دو بخشی، بدون اسکن همهٔ پروفایل‌های یک نقش. */
function matchProfileForBulkEntry(
  entry: DiscoveredPersonEntry,
  lookup: ProfileLookup
): PersonProfileIdentity | undefined {
  const indexed = findBestProfileForDiscoveredEntry(entry, lookup, { exhaustive: false });
  if (indexed) return indexed;

  const key = personSlugTwoPartKey(entry.role, entry.slug);
  if (!key) return undefined;
  const candidates = lookup.byTwoPartSlug.get(key);
  if (!candidates?.length) return undefined;

  return candidates.find(
    (profile) =>
      personSlugsPrefixMatch(entry.slug, profile.slug) ||
      personIdentityMatches(
        { role: entry.role, slug: entry.slug, displayName: entry.displayName },
        profile
      )
  );
}

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

  if (profile && isLatinPersonSlug(profile.slug)) {
    const profileKey = `${entry.role}:${profile.slug}`;
    if (latinKeysInDiscovery.has(profileKey)) {
      return false;
    }
  }

  return true;
}

export type DiscoveredPeopleBuild = {
  people: DiscoveredPerson[];
  /** role:slug → شناسهٔ آیتم‌ها. اسلاگ ادغام‌شده همهٔ آیتم‌های گروه را دارد. */
  itemIndex: Record<string, string[]>;
  /** هویت پروفایل بدون متن زندگی‌نامه — تطبیق سریع، بعد یک خواندن تکی */
  profiles: PersonProfileIdentity[];
};

/** اسکن کامل metadata آیتم‌ها — فقط برای rebuild کش */
export async function buildDiscoveredPeopleList(
  client: PrismaClient = prisma
): Promise<DiscoveredPeopleBuild> {
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
        imageUrl: true,
      },
    }),
  ]);

  const map = new Map<string, DiscoveredPersonEntry>();

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
          existing.itemIds?.add(row.id);
        } else {
          map.set(key, {
            role,
            slug,
            displayName: name.trim(),
            itemKeys: new Set([itemKey]),
            itemIds: new Set([row.id]),
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

  const imageUrlByProfileKey = new Map(
    profiles.map((profile) => [`${profile.role}:${profile.slug}`, profile.imageUrl] as const)
  );
  const profileByEntryKey = new Map<string, PersonProfileIdentity | undefined>();
  for (const entry of mergedEntries) {
    profileByEntryKey.set(
      `${entry.role}:${entry.slug}`,
      matchProfileForBulkEntry(entry, profileLookup)
    );
  }

  const discovered: DiscoveredPerson[] = mergedEntries.map((entry) => {
    const profile = profileByEntryKey.get(`${entry.role}:${entry.slug}`);
    const imageUrl = profile
      ? imageUrlByProfileKey.get(`${profile.role}:${profile.slug}`)
      : null;
    return {
      role: entry.role,
      slug: entry.slug,
      displayName: entry.displayName,
      itemCount: entry.itemKeys.size,
      hasProfile: profile != null,
      hasBio: Boolean(profile?.bio?.trim()),
      profileStatus: profile?.status ?? null,
      imageStatus: personImageStorageStatus(imageUrl),
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

  const itemIndex: Record<string, string[]> = {};
  for (const [key, entry] of map) {
    if (entry.itemIds?.size) itemIndex[key] = [...entry.itemIds];
  }
  for (const entry of mergedEntries) {
    if (entry.itemIds?.size) {
      itemIndex[`${entry.role}:${entry.slug}`] = [...entry.itemIds];
    }
  }

  const slimProfiles = profileIdentities.map((profile) => ({
    role: profile.role,
    slug: profile.slug,
    displayName: profile.displayName,
    externalUrl: profile.externalUrl,
    status: profile.status,
    bio: profile.bio?.trim() ? '1' : null,
  }));

  return { people: filtered, itemIndex, profiles: slimProfiles };
}
