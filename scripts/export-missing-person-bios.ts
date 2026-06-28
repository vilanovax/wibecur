/**
 * Export people missing bio — run: npx tsx scripts/export-missing-person-bios.ts
 * Output: exports/missing-person-bios-export.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { publicItemWhere, publicListWhere } from '../lib/public-content-filters';
import {
  buildProfileLookup,
  extractPersonNamesFromMetadata,
  findBestProfileForDiscoveredEntry,
  isLatinPersonSlug,
  mergeDiscoveredPersonEntries,
  mergeItemMetadata,
  personItemDedupeKey,
  personSlug,
  PERSON_ROLES,
  type PersonRole,
} from '../lib/people';
import {
  buildExternalAiPrompt,
  buildPersonBioJsonSchemaDoc,
  PERSON_BIO_JSON_EXAMPLE,
} from '../lib/person-bio-ai';

const prisma = new PrismaClient();

type ExportPerson = {
  role: PersonRole;
  slug: string;
  displayName: string;
  itemCount: number;
  hasProfile: boolean;
  latinSlug: boolean;
};

async function buildMissingBioList() {
  const [rows, profiles] = await Promise.all([
    prisma.items.findMany({
      where: { ...publicItemWhere, lists: publicListWhere },
      select: {
        id: true,
        title: true,
        catalogItemId: true,
        metadata: true,
        catalog_items: { select: { metadata: true } },
      },
      take: 5000,
    }),
    prisma.person_profiles.findMany({
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
      for (const name of extractPersonNamesFromMetadata(merged, role)) {
        const slug = personSlug(name);
        const key = `${role}:${slug}`;
        const existing = map.get(key);
        if (existing) existing.itemKeys.add(itemKey);
        else map.set(key, { role, slug, displayName: name.trim(), itemKeys: new Set([itemKey]) });
      }
    }
  }

  const profileIdentities = profiles.map((p) => ({
    role: p.role as PersonRole,
    slug: p.slug,
    displayName: p.displayName,
    bio: p.bio,
    externalUrl: p.externalUrl,
    status: p.status as 'draft' | 'published',
  }));
  const lookup = buildProfileLookup(profileIdentities);
  const mergedEntries = mergeDiscoveredPersonEntries(
    Array.from(map.values()),
    profileIdentities
  );

  return mergedEntries.map((entry) => {
    const profile = findBestProfileForDiscoveredEntry(entry, lookup);
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
}

async function main() {
  const [discovered, profileCount] = await Promise.all([
    buildMissingBioList(),
    prisma.person_profiles.count(),
  ]);

  const missing = discovered.filter((person) => !person.hasBio);
  const noProfile = missing.filter((person) => !person.hasProfile);
  const profileNoBio = missing.filter((person) => person.hasProfile);

  const byRole = (list: typeof missing) => {
    const counts: Record<string, number> = {};
    for (const person of list) {
      counts[person.role] = (counts[person.role] ?? 0) + 1;
    }
    return counts;
  };

  const exportPeople: ExportPerson[] = missing.map((person) => ({
    role: person.role,
    slug: person.slug,
    displayName: person.displayName,
    itemCount: person.itemCount,
    hasProfile: person.hasProfile,
    latinSlug: isLatinPersonSlug(person.slug),
  }));

  exportPeople.sort(
    (a, b) =>
      b.itemCount - a.itemCount ||
      a.role.localeCompare(b.role) ||
      a.displayName.localeCompare(b.displayName)
  );

  const latinActorsDirectors = exportPeople.filter(
    (p) => (p.role === 'actor' || p.role === 'director') && p.latinSlug && !p.hasProfile
  );

  const promptPeople = missing;

  const outDir = join(process.cwd(), 'exports');
  mkdirSync(outDir, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalDiscovered: discovered.length,
      totalProfilesInDb: profileCount,
      missingBio: missing.length,
      noProfileRow: noProfile.length,
      profileExistsButNoBio: profileNoBio.length,
      missingBioByRole: byRole(missing),
      noProfileByRole: byRole(noProfile),
      latinActorDirectorNoProfile: latinActorsDirectors.length,
    },
    reimportPriority: {
      description:
        'Latin-slug actors/directors with no profile row — likely deleted by import bug; re-import first.',
      count: latinActorsDirectors.length,
      people: latinActorsDirectors,
    },
    allMissingBio: exportPeople,
    aiPrompt: buildExternalAiPrompt(promptPeople),
    importSchemaDoc: buildPersonBioJsonSchemaDoc(),
    importExample: PERSON_BIO_JSON_EXAMPLE,
  };

  const jsonPath = join(outDir, 'missing-person-bios-export.json');
  const txtPath = join(outDir, 'missing-person-bios-names.txt');
  const promptPath = join(outDir, 'missing-person-bios-ai-prompt.txt');
  const priorityPath = join(outDir, 'missing-person-bios-priority-reimport.json');

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  writeFileSync(txtPath, exportPeople.map((p) => p.displayName).join('\n'), 'utf8');
  writeFileSync(promptPath, payload.aiPrompt, 'utf8');
  writeFileSync(
    priorityPath,
    JSON.stringify(
      {
        people: latinActorsDirectors.map((p) => ({
          role: p.role,
          slug: p.slug,
          displayName: p.displayName,
          itemCount: p.itemCount,
          bio: 'PLACEHOLDER — replace with 2-4 Persian sentences',
          status: 'published',
        })),
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('=== Missing person bios export ===');
  console.log(JSON.stringify(payload.summary, null, 2));
  console.log('\nFiles written:');
  console.log(' ', jsonPath);
  console.log(' ', txtPath);
  console.log(' ', promptPath);
  console.log(' ', priorityPath);
  console.log('\nPriority re-import (first 20):');
  for (const p of latinActorsDirectors.slice(0, 20)) {
    console.log(`  [${p.role}] ${p.displayName} (${p.slug}) — ${p.itemCount} items`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
