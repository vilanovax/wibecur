import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying database data...\n');

  const userCount = await prisma.users.count();
  const categoryCount = await prisma.categories.count();
  const listCount = await prisma.lists.count();
  const settingsCount = await prisma.settings.count();

  console.log('📊 Data Summary:');
  console.log(`   Users: ${userCount}`);
  console.log(`   Categories: ${categoryCount}`);
  console.log(`   Lists: ${listCount}`);
  console.log(`   Settings: ${settingsCount}`);

  if (userCount > 0) {
    const adminUser = await prisma.users.findUnique({
      where: { email: 'admin@listhub.ir' },
    });
    console.log(`\n✅ Admin user found: ${adminUser.email} (${adminUser.role})`);
  }

  if (categoryCount > 0) {
    const categories = await prisma.categories.findMany({
      orderBy: { order: 'asc' },
    });
    console.log(`\n📂 Categories:`);
    categories.forEach((cat) => {
      console.log(`   ${cat.icon} ${cat.name} (${cat.slug})`);
    });
  }

  if (listCount > 0) {
    const lists = await prisma.lists.findMany({
      include: {
        categories: true,
      },
      take: 5,
    });
    console.log(`\n📝 Sample Lists (first 5):`);
    lists.forEach((list) => {
      console.log(`   - ${list.title} [${list.categories.name}]`);
    });
  }

  console.log('\n✅ Verification complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
