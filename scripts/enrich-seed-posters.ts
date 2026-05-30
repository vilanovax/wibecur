/**
 * Batch enrich poster آیتم‌های فیلم — DB + اختیاری seed-data.json
 *
 * نیاز: TMDB API key در Admin → Settings یا env TMDB_API_KEY
 *
 * استفاده:
 *   npm run enrich:posters
 *   npm run enrich:posters -- --dry-run
 *   npm run enrich:posters -- --list-slug=90s-action-movies
 *   npm run enrich:posters -- --update-seed-json
 *   npm run enrich:posters -- --force --limit=20
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { getDecryptedSettings } from '../lib/settings';
import {
  extractPosterSearchTitles,
  fetchTmdbPosterUrl,
  isGenericSeedMovieTitle,
} from '../lib/tmdb-poster';
import { itemNeedsPosterEnrich } from '../lib/item-poster-needs-enrich';
import { isMovieLikeCategory } from '../lib/resolve-item-image';

const prisma = new PrismaClient();
const SEED_DATA_PATH = path.join(__dirname, '../prisma/seed-data.json');
const DEFAULT_DELAY_MS = 280;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const includeGeneric = args.includes('--include-generic');
const updateSeedJson = args.includes('--update-seed-json');
const listSlugArg = args.find((a) => a.startsWith('--list-slug='));
const listSlug = listSlugArg ? listSlugArg.split('=')[1]?.trim() : undefined;
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Math.max(1, parseInt(limitArg.split('=')[1], 10) || 0) : undefined;
const delayArg = args.find((a) => a.startsWith('--delay='));
const delayMs = delayArg ? Math.max(0, parseInt(delayArg.split('=')[1], 10) || DEFAULT_DELAY_MS) : DEFAULT_DELAY_MS;

type SeedDataFile = {
  items?: Array<{
    id: string;
    title: string;
    imageUrl?: string | null;
    metadata?: Record<string, unknown> | null;
  }>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function resolveTmdbApiKey(): Promise<string | null> {
  try {
    const settings = await getDecryptedSettings();
    if (settings.tmdbApiKey?.trim()) return settings.tmdbApiKey.trim();
  } catch (err) {
    console.warn('⚠️  Could not read settings from DB:', err);
  }
  const envKey = process.env.TMDB_API_KEY?.trim();
  return envKey || null;
}

async function run() {
  console.log('🎬 Enrich seed movie posters (TMDB)\n');
  if (dryRun) console.log('   [DRY-RUN] No DB/seed writes.\n');
  if (listSlug) console.log(`   List filter: ${listSlug}`);
  if (force) console.log('   Force: re-fetch all movie items');
  if (updateSeedJson) console.log('   Will update prisma/seed-data.json');
  console.log(`   Delay: ${delayMs}ms between requests\n`);

  const apiKey = await resolveTmdbApiKey();
  if (!apiKey) {
    console.error('❌ TMDB API key not found.');
    console.error('   Set in Admin → Settings or TMDB_API_KEY in .env');
    process.exit(1);
  }

  const items = await prisma.items.findMany({
    where: listSlug
      ? { lists: { slug: listSlug } }
      : {
          lists: {
            categories: {
              OR: [
                { slug: { contains: 'movie', mode: 'insensitive' } },
                { slug: { contains: 'film', mode: 'insensitive' } },
                { slug: { equals: 'series', mode: 'insensitive' } },
              ],
            },
          },
        },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      metadata: true,
      lists: {
        select: {
          slug: true,
          title: true,
          categories: { select: { slug: true, name: true } },
        },
      },
    },
    orderBy: [{ lists: { slug: 'asc' } }, { order: 'asc' }],
  });

  const movieItems = items.filter((item) =>
    isMovieLikeCategory(item.lists?.categories?.slug ?? null)
  );

  let candidates = movieItems.filter((item) =>
    itemNeedsPosterEnrich({
      title: item.title,
      imageUrl: item.imageUrl,
      metadata: item.metadata as Record<string, unknown> | null,
      categorySlug: item.lists?.categories?.slug ?? null,
      force,
    })
  );

  if (!includeGeneric) {
    const before = candidates.length;
    candidates = candidates.filter((item) => !isGenericSeedMovieTitle(item.title));
    const skippedGeneric = before - candidates.length;
    if (skippedGeneric > 0) {
      console.log(`   Skipped ${skippedGeneric} generic seed titles (use --include-generic to try)\n`);
    }
  }

  if (limit) candidates = candidates.slice(0, limit);

  console.log(`📦 ${candidates.length} items to enrich (of ${movieItems.length} movie items)\n`);
  if (candidates.length === 0) {
    console.log('✅ Nothing to do.');
    return;
  }

  const seedUpdates = new Map<string, string>();
  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i];
    const meta = (item.metadata ?? {}) as Record<string, unknown>;
    const year = meta.year as string | number | undefined;
    const altTitles = extractPosterSearchTitles(item.title, meta);
    const listLabel = item.lists?.slug ?? '?';

    process.stdout.write(`   [${i + 1}/${candidates.length}] ${item.title} (${listLabel}) … `);

    try {
      const posterUrl = await fetchTmdbPosterUrl(apiKey, {
        title: item.title,
        year,
        alternativeTitles: altTitles,
      });

      if (!posterUrl) {
        console.log('⏭️  not found');
        skipped++;
      } else if (dryRun) {
        console.log(`✓ ${posterUrl}`);
        enriched++;
      } else {
        await prisma.items.update({
          where: { id: item.id },
          data: { imageUrl: posterUrl },
        });
        seedUpdates.set(item.id, posterUrl);
        console.log('✅ saved');
        enriched++;
      }
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : err}`);
      failed++;
    }

    if (i < candidates.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  if (updateSeedJson && seedUpdates.size > 0 && !dryRun) {
    console.log('\n📝 Updating seed-data.json…');
    const raw = fs.readFileSync(SEED_DATA_PATH, 'utf-8');
    const seedData = JSON.parse(raw) as SeedDataFile;
    let seedChanged = 0;

    if (seedData.items) {
      for (const seedItem of seedData.items) {
        const url = seedUpdates.get(seedItem.id);
        if (url) {
          seedItem.imageUrl = url;
          seedChanged++;
        }
      }
    }

    fs.writeFileSync(SEED_DATA_PATH, `${JSON.stringify(seedData, null, 2)}\n`);
    console.log(`   Updated ${seedChanged} items in seed-data.json`);
  }

  console.log('\n— Summary —');
  console.log(`   Enriched: ${enriched}`);
  console.log(`   Not found: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log('\n✅ Done.');
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
