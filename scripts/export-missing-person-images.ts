/**
 * Export people missing storage images — run: npx tsx scripts/export-missing-person-images.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { publicItemWhere, publicListWhere } from '../lib/public-content-filters';
import {
  extractPersonNamesFromMetadata,
  mergeItemMetadata,
  personItemDedupeKey,
  personSlug,
  PERSON_ROLES,
  type PersonRole,
} from '../lib/people';
import { personImageStorageStatus } from '../lib/person-image-utils';
import {
  buildExternalAiImagePrompt,
  buildPersonImageJsonSchemaDoc,
  formatMissingImageNameList,
  PERSON_IMAGE_JSON_EXAMPLE,
  type PersonMissingImageEntry,
} from '../lib/person-image-ai';

const prisma = new PrismaClient();

async function buildMissingImageList(): Promise<PersonMissingImageEntry[]> {
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
      select: { role: true, slug: true, displayName: true, imageUrl: true },
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

  const people = [...map.values()].map((entry) => {
    const profile = profiles.find((p) => p.role === entry.role && p.slug === entry.slug);
    const imageStatus = personImageStorageStatus(profile?.imageUrl);
    return {
      role: entry.role,
      slug: entry.slug,
      displayName: entry.displayName,
      itemCount: entry.itemKeys.size,
      imageStatus,
    };
  });

  return people
    .filter((p) => p.imageStatus !== 'storage')
    .sort((a, b) => b.itemCount - a.itemCount || a.displayName.localeCompare(b.displayName, 'fa'));
}

async function main() {
  const missing = await buildMissingImageList();
  const nameList = formatMissingImageNameList(missing);
  const prompt = buildExternalAiImagePrompt(missing);

  const outDir = join(process.cwd(), 'exports');
  mkdirSync(outDir, { recursive: true });

  writeFileSync(join(outDir, 'missing-person-images-names.txt'), nameList, 'utf8');
  writeFileSync(join(outDir, 'missing-person-images-ai-prompt.txt'), prompt, 'utf8');
  writeFileSync(
    join(outDir, 'missing-person-images-export.json'),
    JSON.stringify(
      {
        count: missing.length,
        people: missing,
        schemaDoc: buildPersonImageJsonSchemaDoc(),
        example: PERSON_IMAGE_JSON_EXAMPLE,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`=== Missing person images: ${missing.length} ===\n`);
  console.log(nameList);
  console.log(`\nExported to exports/missing-person-images-*.txt/json`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
