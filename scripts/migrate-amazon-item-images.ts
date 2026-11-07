/**
 * Migrate Amazon/IMDb item posters to ParsPack so next/image never touches them.
 *
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-amazon-item-images.ts
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-amazon-item-images.ts --dry-run
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-amazon-item-images.ts --limit=5
 */
import { PrismaClient } from '@prisma/client';
import { ensureImageInLiara } from '../lib/object-storage';
import { getObjectStorageConfig, isOurStorageUrl } from '../lib/object-storage-config';
import { isAmazonOrImdbImageUrl } from '../lib/image-url-policy';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Math.max(1, parseInt(limitArg.split('=')[1] || '50', 10) || 50) : 50;

async function run() {
  const config = await getObjectStorageConfig();
  if (!config && !dryRun) {
    console.error('Object storage not configured');
    process.exit(1);
  }

  const items = await prisma.items.findMany({
    where: {
      OR: [
        { imageUrl: { contains: 'media-amazon.com' } },
        { imageUrl: { contains: 'media-imdb.com' } },
        { imageUrl: { contains: 'ssl-images-amazon.com' } },
      ],
    },
    select: { id: true, title: true, imageUrl: true },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });

  console.log(`Found ${items.length} Amazon/IMDb posters (dryRun=${dryRun})`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    const url = item.imageUrl?.trim() ?? '';
    if (!url || isOurStorageUrl(url) || !isAmazonOrImdbImageUrl(url)) {
      skipped++;
      continue;
    }

    console.log(`migrate ${item.title}`);
    console.log(`  from ${url.slice(0, 100)}`);

    if (dryRun) {
      migrated++;
      continue;
    }

    try {
      const newUrl = await ensureImageInLiara(url, 'items');
      if (newUrl && newUrl !== url && isOurStorageUrl(newUrl)) {
        await prisma.items.update({
          where: { id: item.id },
          data: { imageUrl: newUrl },
        });
        console.log(`  -> ${newUrl}`);
        migrated++;
      } else {
        console.log(`  kept original (upload returned ${newUrl ?? 'null'})`);
        failed++;
      }
    } catch (e) {
      console.error(`  error:`, (e as Error).message);
      failed++;
    }
  }

  console.log(JSON.stringify({ migrated, skipped, failed }, null, 2));
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
