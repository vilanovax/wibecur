/**
 * ورود لیست و آیتم از JSON.
 *   npx tsx scripts/ingest-list.ts --models
 *   npx tsx scripts/ingest-list.ts --categories
 *   npx tsx scripts/ingest-list.ts --file content/lists/example.json --dry-run
 *   npx tsx scripts/ingest-list.ts --file content/lists/example.json
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { renderIngestModels } from '../lib/content/ingest-models';
import { ingestKindForSlug } from '../lib/content/ingest-models';
import { ingestListFile } from '../lib/content/ingest-list';

function flag(name: string): boolean {
  return process.argv.includes(name);
}

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function printUsage() {
  console.error(`استفاده:
  npm run content:models
  npm run content:categories
  npm run content:ingest -- --file content/lists/<slug>.json --dry-run
  npm run content:ingest -- --file content/lists/<slug>.json
  npm run content:ingest -- --file content/lists/<slug>.json --overwrite`);
}

async function main() {
  if (flag('--models')) {
    console.log(JSON.stringify(renderIngestModels(), null, 2));
    return;
  }

  const prisma = new PrismaClient();
  try {
    if (flag('--categories')) {
      const categories = await prisma.categories.findMany({
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        select: { slug: true, name: true, isActive: true },
      });
      console.log(
        JSON.stringify(
          {
            categories: categories.map((category) => ({
              ...category,
              kind: ingestKindForSlug(category.slug),
            })),
          },
          null,
          2
        )
      );
      return;
    }

    const file = option('--file');
    if (!file) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    const report = await ingestListFile(prisma, file, {
      dryRun: flag('--dry-run'),
      overwriteExistingData: flag('--overwrite'),
    });
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'خطای ناشناخته';
  console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exitCode = 1;
});
