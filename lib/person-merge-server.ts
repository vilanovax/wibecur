import 'server-only';

import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidateAdminPeopleCache } from '@/lib/admin/admin-cache';
import { publicItemWhere, publicListWhere } from '@/lib/public-content-filters';
import {
  extractPersonNamesFromMetadata,
  mergeItemMetadata,
  parseActorNames,
  PERSON_ROLE_META,
  personIdentityMatches,
  personSlug,
  type PersonRole,
} from '@/lib/people';
import {
  buildMergedDisplayName,
  personNamesLikelySamePerson,
} from '@/lib/person-name-similarity';
import {
  getPersonProfile,
  revalidatePersonPageCache,
  upsertPersonProfile,
} from '@/lib/person-profiles-server';
import type { PersonProfileRecord } from '@/lib/person-profiles';

function metaRecord(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function namesEqual(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

function replaceActorNames(value: unknown, aliasName: string, canonicalName: string): unknown {
  const names = parseActorNames(value);
  if (names.length === 0) return value;

  let changed = false;
  const next = names.map((name) => {
    if (!namesEqual(name, aliasName)) return name;
    changed = true;
    return canonicalName;
  });
  if (!changed) return value;
  return next;
}

function replaceTranslatorTip(value: unknown, aliasName: string, canonicalName: string): unknown {
  if (typeof value !== 'string') return value;
  const match = value.trim().match(/^مترجم\s*[:：]\s*(.+)$/u);
  if (!match?.[1] || !namesEqual(match[1], aliasName)) return value;
  return value.replace(match[1], canonicalName);
}

/** جایگزینی نام alias با canonical در metadata — null اگر تغییری نبود */
export function replacePersonNameInMetadata(
  metadata: unknown,
  role: PersonRole,
  aliasName: string,
  canonicalName: string
): Record<string, unknown> | null {
  const meta = { ...metaRecord(metadata) };
  const key = PERSON_ROLE_META[role].metadataKey;
  let changed = false;

  if (role === 'actor') {
    const nextActors = replaceActorNames(meta[key], aliasName, canonicalName);
    if (nextActors !== meta[key]) {
      meta[key] = nextActors;
      changed = true;
    }
  } else if (role === 'translator') {
    if (typeof meta.translator === 'string' && namesEqual(meta.translator, aliasName)) {
      meta.translator = canonicalName;
      changed = true;
    }
    const nextTip = replaceTranslatorTip(meta.tip, aliasName, canonicalName);
    if (nextTip !== meta.tip) {
      meta.tip = nextTip;
      changed = true;
    }
  } else if (typeof meta[key] === 'string' && namesEqual(String(meta[key]), aliasName)) {
    meta[key] = canonicalName;
    changed = true;
  }

  return changed ? meta : null;
}

function metadataHasAliasName(
  metadata: unknown,
  role: PersonRole,
  aliasName: string
): boolean {
  const names = extractPersonNamesFromMetadata(metaRecord(metadata), role);
  return names.some((name) => namesEqual(name, aliasName));
}

async function updateItemsWithAliasName(
  client: PrismaClient,
  role: PersonRole,
  aliasName: string,
  canonicalName: string
): Promise<number> {
  const rows = await client.items.findMany({
    where: {
      ...publicItemWhere,
      lists: publicListWhere,
    },
    select: {
      id: true,
      metadata: true,
      catalogItemId: true,
      catalog_items: { select: { id: true, metadata: true } },
    },
    take: 5000,
  });

  let updatedItems = 0;

  for (const row of rows) {
    const nextItemMeta = replacePersonNameInMetadata(row.metadata, role, aliasName, canonicalName);
    const nextCatalogMeta = row.catalog_items
      ? replacePersonNameInMetadata(row.catalog_items.metadata, role, aliasName, canonicalName)
      : null;

    if (!nextItemMeta && !nextCatalogMeta) {
      const merged = mergeItemMetadata(row.metadata, row.catalog_items?.metadata);
      if (!metadataHasAliasName(merged, role, aliasName)) continue;
    }

    if (nextItemMeta) {
      await client.items.update({
        where: { id: row.id },
        data: { metadata: nextItemMeta as Prisma.InputJsonValue },
      });
      updatedItems += 1;
    }

    if (nextCatalogMeta && row.catalog_items) {
      await client.catalog_items.update({
        where: { id: row.catalog_items.id },
        data: { metadata: nextCatalogMeta as Prisma.InputJsonValue },
      });
    }
  }

  return updatedItems;
}

function mergeProfileFields(
  canonical: PersonProfileRecord | null,
  aliases: PersonProfileRecord[]
): {
  displayName: string;
  bio: string | null;
  imageUrl: string | null;
  tmdbId: number | null;
  externalUrl: string | null;
  status: 'draft' | 'published';
} {
  const all = [canonical, ...aliases].filter(Boolean) as PersonProfileRecord[];
  const names = all.flatMap((profile) =>
    profile.displayName
      .split('·')
      .map((part) => part.trim())
      .filter(Boolean)
  );

  const bestBio =
    all.find((profile) => profile.bio?.trim())?.bio?.trim() ??
    canonical?.bio?.trim() ??
    null;
  const bestImage =
    all.find((profile) => profile.imageUrl?.trim())?.imageUrl?.trim() ??
    canonical?.imageUrl?.trim() ??
    null;
  const bestTmdb = all.find((profile) => profile.tmdbId != null)?.tmdbId ?? canonical?.tmdbId ?? null;
  const bestExternal =
    all.find((profile) => profile.externalUrl?.trim())?.externalUrl?.trim() ??
    canonical?.externalUrl?.trim() ??
    null;
  const status = all.some((profile) => profile.status === 'published') ? 'published' : 'draft';

  return {
    displayName: buildMergedDisplayName(names),
    bio: bestBio,
    imageUrl: bestImage,
    tmdbId: bestTmdb,
    externalUrl: bestExternal,
    status,
  };
}

export type MergePeopleResult = {
  canonicalSlug: string;
  mergedAliases: string[];
  updatedItems: number;
  deletedProfiles: string[];
};

/** ادغام aliasها در canonical — metadata آیتم‌ها + پروفایل */
export async function mergeDiscoveredPeopleByAdmin(
  client: PrismaClient,
  input: {
    role: PersonRole;
    canonicalSlug: string;
    canonicalDisplayName: string;
    aliases: Array<{ slug: string; displayName: string }>;
  }
): Promise<MergePeopleResult> {
  const { role, canonicalSlug, canonicalDisplayName } = input;
  const aliases = input.aliases.filter((alias) => alias.slug !== canonicalSlug);

  if (aliases.length === 0) {
    throw new Error('حداقل یک نام مشابه برای ادغام انتخاب کنید');
  }

  for (const alias of aliases) {
    if (
      !personNamesLikelySamePerson(alias.displayName, canonicalDisplayName) &&
      !personIdentityMatches(
        { role, slug: canonicalSlug, displayName: canonicalDisplayName },
        { role, slug: alias.slug, displayName: alias.displayName }
      )
    ) {
      throw new Error(`«${alias.displayName}» با «${canonicalDisplayName}» شباهت کافی ندارد`);
    }
  }

  let updatedItems = 0;
  for (const alias of aliases) {
    updatedItems += await updateItemsWithAliasName(
      client,
      role,
      alias.displayName.trim(),
      canonicalDisplayName.trim()
    );
  }

  const canonicalProfile = await getPersonProfile(client, role, canonicalSlug);
  const aliasProfiles: PersonProfileRecord[] = [];
  for (const alias of aliases) {
    const profile = await getPersonProfile(client, role, alias.slug);
    if (profile) aliasProfiles.push(profile);
  }

  const mergedFields = mergeProfileFields(canonicalProfile, aliasProfiles);
  await upsertPersonProfile(client, {
    role,
    slug: canonicalSlug,
    displayName: mergedFields.displayName || canonicalDisplayName.trim(),
    bio: mergedFields.bio,
    imageUrl: mergedFields.imageUrl,
    tmdbId: mergedFields.tmdbId,
    externalUrl: mergedFields.externalUrl,
    status: mergedFields.status,
  });

  const deletedProfiles: string[] = [];
  for (const alias of aliases) {
    if (alias.slug === canonicalSlug) continue;
    const existing = await getPersonProfile(client, role, alias.slug);
    if (!existing) continue;
    await client.person_profiles.delete({
      where: { role_slug: { role, slug: alias.slug } },
    });
    deletedProfiles.push(alias.slug);
    revalidatePersonPageCache(role, alias.slug);
  }

  revalidatePersonPageCache(role, canonicalSlug);
  revalidateAdminPeopleCache();

  return {
    canonicalSlug,
    mergedAliases: aliases.map((alias) => alias.slug),
    updatedItems,
    deletedProfiles,
  };
}

export async function mergeDiscoveredPeopleByAdminDefault(
  input: Parameters<typeof mergeDiscoveredPeopleByAdmin>[1]
): Promise<MergePeopleResult> {
  return mergeDiscoveredPeopleByAdmin(prisma, input);
}
