import { PrismaClient } from '@prisma/client';
import { uploadImageFromUrl } from '../lib/object-storage';

const prisma = new PrismaClient();

/**
 * Migrate all external item images to Liara Object Storage
 * with optimized image standards
 */
async function migrateImagesToLiara() {
  try {
    console.log('🚀 Starting image migration to Liara...\n');

    // Get all items with external images (not already in Liara)
    const items = await prisma.items.findMany({
      where: {
        imageUrl: {
          not: null,
          startsWith: 'http',
        },
        NOT: {
          imageUrl: {
            contains: 'storage.c2.liara.space',
          },
        },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
      },
    });

    console.log(`📊 Found ${items.length} items with external images\n`);

    if (items.length === 0) {
      console.log('✅ No items to migrate. All images are already in Liara or local.');
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const failed: Array<{ id: string; title: string; error: string }> = [];

    // Process each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`\n[${i + 1}/${items.length}] Processing: ${item.title}`);
      console.log(`   Original URL: ${item.imageUrl}`);

      try {
        // Upload image to Liara with 'itemImage' profile optimization
        const uploadedUrl = await uploadImageFromUrl(item.imageUrl!, 'items');

        if (uploadedUrl) {
          // Update database with new URL
          await prisma.items.update({
            where: { id: item.id },
            data: {
              imageUrl: uploadedUrl,
              updatedAt: new Date(),
            },
          });

          console.log(`   ✅ Success: ${uploadedUrl}`);
          successCount++;
        } else {
          console.log(`   ⚠️  Upload failed, keeping original URL`);
          failCount++;
          failed.push({
            id: item.id,
            title: item.title,
            error: 'Upload returned null',
          });
        }
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        failCount++;
        failed.push({
          id: item.id,
          title: item.title,
          error: error.message,
        });
      }

      // Small delay to avoid overwhelming the server
      if (i < items.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${successCount} images`);
    console.log(`❌ Failed: ${failCount} images`);
    console.log(`📊 Total processed: ${items.length} items`);

    if (failed.length > 0) {
      console.log('\n⚠️  Failed items:');
      failed.forEach((item) => {
        console.log(`   - ${item.title} (${item.id}): ${item.error}`);
      });
    }

    console.log('\n✨ Migration completed!\n');
  } catch (error: any) {
    console.error('❌ Fatal error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateImagesToLiara()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
