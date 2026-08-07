/**
 * Batch enrich searchProfile برای آیتم‌های کاتالوگ — با OpenAI
 *
 * نیاز: OpenAI API key در Admin → Settings یا env
 *
 * استفاده:
 *   npm run enrich:search
 *   npm run enrich:search -- --dry-run
 *   npm run enrich:search -- --only-missing
 *   npm run enrich:search -- --category=movie --limit=50
 *   npm run enrich:search -- --force --delay=800
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getDecryptedSettings } from '../lib/settings';
import {
  catalogHasSearchProfile,
  enrichCatalogSearchProfile,
} from '../lib/catalog-search-profile';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const onlyMissing = args.includes('--only-missing') || !force;
const categoryArg = args.find((a) => a.startsWith('--category='));
const categorySlug = categoryArg ? categoryArg.split('=')[1]?.trim() : undefined;
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Math.max(1, parseInt(limitArg.split('=')[1], 10) || 0) : undefined;
const delayArg = args.find((a) => a.startsWith('--delay='));
const DEFAULT_DELAY_MS = 600;
const delayMs = delayArg
  ? Math.max(0, parseInt(delayArg.split('=')[1], 10) || DEFAULT_DELAY_MS)
  : DEFAULT_DELAY_MS;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function resolveOpenAIConfigured(): Promise<boolean> {
  try {
    const settings = await getDecryptedSettings();
    if (settings.openaiApiKey?.trim()) return true;
  } catch (err) {
    console.warn('⚠️  Could not read settings from DB:', err);
  }
  return !!process.env.OPENAI_API_KEY?.trim();
}

async function run() {
  console.log('🔍 Enrich catalog search profiles (OpenAI)\n');
  if (dryRun) console.log('   [DRY-RUN] No DB writes.\n');
  if (onlyMissing) console.log('   Only items without searchProfile');
  if (force) console.log('   Force: rebuild existing profiles');
  if (categorySlug) console.log(`   Category: ${categorySlug}`);
  if (limit) console.log(`   Limit: ${limit}`);
  console.log(`   Delay: ${delayMs}ms between requests\n`);

  const hasKey = await resolveOpenAIConfigured();
  if (!hasKey) {
    console.error('❌ OpenAI API key not found.');
    console.error('   Set in Admin → Settings or OPENAI_API_KEY in .env');
    process.exit(1);
  }

  const rows = await prisma.catalog_items.findMany({
    where: {
      ...(categorySlug ? { categorySlug } : {}),
    },
    select: {
      id: true,
      title: true,
      metadata: true,
      categorySlug: true,
    },
    orderBy: { updatedAt: 'desc' },
    ...(limit ? { take: limit * 3 } : {}),
  });

  const candidates = rows.filter((row) => {
    if (!onlyMissing) return true;
    return !catalogHasSearchProfile(row.metadata);
  });

  const toProcess = limit ? candidates.slice(0, limit) : candidates;

  console.log(
    `📦 ${toProcess.length} items to enrich (of ${rows.length} catalog items, ${candidates.length} candidates)\n`
  );

  if (toProcess.length === 0) {
    console.log('✅ Nothing to do.');
    return;
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const row = toProcess[i];
    const prefix = `[${i + 1}/${toProcess.length}]`;

    if (dryRun) {
      const has = catalogHasSearchProfile(row.metadata);
      console.log(`${prefix} ${row.title} (${row.categorySlug ?? '—'}) — would ${has && !force ? 'skip' : 'enrich'}`);
      continue;
    }

    process.stdout.write(`${prefix} ${row.title}… `);
    const result = await enrichCatalogSearchProfile(prisma, row.id, { force });

    if (result.status === 'updated') {
      updated++;
      const kw = result.profile?.keywords?.slice(0, 3).join(', ') ?? '';
      console.log(`✅ ${kw ? `(${kw})` : 'done'}`);
    } else if (result.status === 'skipped') {
      skipped++;
      console.log('⏭️  skipped');
    } else {
      failed++;
      console.log(`❌ ${result.error ?? 'error'}`);
    }

    if (i < toProcess.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  if (!dryRun) {
    console.log('\n--- Summary ---');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed:  ${failed}`);
  }
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
