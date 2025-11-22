import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking item metadata...\n');

  // Get the first item from movies category
  const items = await prisma.items.findMany({
    include: {
      lists: {
        include: {
          categories: true,
        },
      },
    },
    take: 5,
  });

  console.log(`📊 Found ${items.length} items\n`);

  items.forEach((item, idx) => {
    console.log(`\n--- Item ${idx + 1} ---`);
    console.log(`Title: ${item.title}`);
    console.log(`Category: ${item.lists.categories.name} (${item.lists.categories.slug})`);
    console.log(`Metadata type: ${typeof item.metadata}`);
    console.log(`Metadata:`, JSON.stringify(item.metadata, null, 2));
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
