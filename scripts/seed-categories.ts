import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      name: 'کتاب و ادبیات',
      slug: 'books',
      icon: '📚',
      color: '#8B4513',
      description: 'بهترین کتاب‌ها و آثار ادبی',
      order: 1,
    },
    {
      name: 'کافه و قهوه‌خانه',
      slug: 'cafes',
      icon: '☕',
      color: '#6F4E37',
      description: 'بهترین کافه‌ها و قهوه‌خانه‌های شهر',
      order: 2,
    },
    {
      name: 'رستوران و غذا',
      slug: 'restaurants',
      icon: '🍽️',
      color: '#FF6B6B',
      description: 'بهترین رستوران‌ها و غذاهای محلی',
      order: 3,
    },
    {
      name: 'موسیقی و پادکست',
      slug: 'music-podcast',
      icon: '🎵',
      color: '#1DB954',
      description: 'آهنگ‌ها، آلبوم‌ها و پادکست‌های برتر',
      order: 4,
    },
    {
      name: 'بازی و سرگرمی',
      slug: 'games',
      icon: '🎮',
      color: '#9146FF',
      description: 'بازی‌های ویدیویی و سرگرمی‌های دیجیتال',
      order: 5,
    },
    {
      name: 'سفر و گردشگری',
      slug: 'travel',
      icon: '✈️',
      color: '#00A8E8',
      description: 'مقاصد گردشگری و راهنمای سفر',
      order: 6,
    },
    {
      name: 'هنر و گالری',
      slug: 'art',
      icon: '🎨',
      color: '#FF00FF',
      description: 'آثار هنری، نقاشی و گالری‌های هنری',
      order: 7,
    },
    {
      name: 'ورزش و تناسب اندام',
      slug: 'sports',
      icon: '⚽',
      color: '#FF4500',
      description: 'ورزش‌ها، باشگاه‌ها و تمرینات',
      order: 8,
    },
    {
      name: 'تکنولوژی و گجت',
      slug: 'technology',
      icon: '💻',
      color: '#0080FF',
      description: 'محصولات تکنولوژی و گجت‌های جدید',
      order: 9,
    },
    {
      name: 'مد و فشن',
      slug: 'fashion',
      icon: '👗',
      color: '#E91E63',
      description: 'برندها، لباس‌ها و ترندهای مد',
      order: 10,
    },
  ];

  console.log('🎯 در حال ایجاد دسته‌بندی‌ها...\n');

  for (const categoryData of categories) {
    try {
      // Check if category already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug }
      });

      if (existingCategory) {
        console.log(`⚠️  دسته‌بندی "${categoryData.name}" قبلاً وجود دارد`);
        continue;
      }

      const category = await prisma.category.create({
        data: {
          ...categoryData,
          isActive: true,
        },
      });

      console.log(`✅ دسته‌بندی ایجاد شد: ${category.icon} ${category.name}`);
    } catch (error) {
      console.error(`❌ خطا در ایجاد دسته‌بندی "${categoryData.name}":`, error);
    }
  }

  console.log('\n✨ تمام دسته‌بندی‌ها با موفقیت ایجاد شدند!\n');

  // Show all categories
  const allCategories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    select: {
      name: true,
      icon: true,
      slug: true,
      isActive: true,
    }
  });

  console.log('📋 لیست کامل دسته‌بندی‌ها:\n');
  allCategories.forEach((cat, index) => {
    const status = cat.isActive ? '✓' : '✗';
    console.log(`${index + 1}. ${cat.icon} ${cat.name} (${cat.slug}) ${status}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
