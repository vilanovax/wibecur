import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  در حال حذف دسته‌بندی‌های جدید...\n');

  // Delete newly created categories (keeping the old ones)
  const categoriesToDelete = [
    'books', // کتاب و ادبیات (جدید)
    'cafes', // کافه و قهوه‌خانه (جدید)
    'restaurants', // رستوران و غذا (جدید)
    'music-podcast', // موسیقی و پادکست (جدید)
    'games', // بازی و سرگرمی (جدید)
    'travel', // سفر و گردشگری (جدید)
    'art', // هنر و گالری (جدید)
    'sports', // ورزش و تناسب اندام (جدید)
    'technology', // تکنولوژی و گجت (جدید)
    'fashion', // مد و فشن (جدید)
  ];

  for (const slug of categoriesToDelete) {
    try {
      const category = await prisma.category.findUnique({
        where: { slug },
        include: { _count: { select: { lists: true } } }
      });

      if (category) {
        if (category._count.lists > 0) {
          console.log(`⚠️  دسته‌بندی "${category.name}" دارای ${category._count.lists} لیست است، حذف نمی‌شود`);
        } else {
          await prisma.category.delete({ where: { slug } });
          console.log(`✅ دسته‌بندی حذف شد: ${category.icon} ${category.name}`);
        }
      }
    } catch (error) {
      console.log(`⚠️  خطا در حذف دسته‌بندی ${slug}`);
    }
  }

  console.log('\n📚 در حال ایجاد لیست‌های کتاب...\n');

  // Find book category
  const bookCategory = await prisma.category.findFirst({
    where: { slug: 'book' }
  });

  // Find cafe category
  const cafeCategory = await prisma.category.findFirst({
    where: { slug: 'cafe' }
  });

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('❌ کاربر ادمین یافت نشد');
    return;
  }

  if (!bookCategory) {
    console.error('❌ دسته‌بندی کتاب یافت نشد');
    return;
  }

  if (!cafeCategory) {
    console.error('❌ دسته‌بندی کافه یافت نشد');
    return;
  }

  // Book lists
  const bookLists = [
    {
      title: 'بهترین رمان‌های کلاسیک جهان',
      slug: 'best-classic-novels',
      description: 'شاهکارهای ادبیات کلاسیک که باید خواند',
      categoryId: bookCategory.id,
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      title: 'کتاب‌های روانشناسی پرفروش',
      slug: 'bestselling-psychology-books',
      description: 'کتاب‌هایی که ذهن شما را متحول می‌کنند',
      categoryId: bookCategory.id,
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      title: 'رمان‌های معاصر ایرانی',
      slug: 'contemporary-persian-novels',
      description: 'آثار برجسته نویسندگان معاصر ایران',
      categoryId: bookCategory.id,
      badge: null,
      isFeatured: false,
    },
    {
      title: 'کتاب‌های کسب و کار و موفقیت',
      slug: 'business-success-books',
      description: 'راهنمای موفقیت در کسب و کار و زندگی',
      categoryId: bookCategory.id,
      badge: 'NEW',
      isFeatured: false,
    },
    {
      title: 'داستان‌های کوتاه برتر',
      slug: 'best-short-stories',
      description: 'مجموعه‌های داستان کوتاه ماندگار',
      categoryId: bookCategory.id,
      badge: null,
      isFeatured: false,
    },
  ];

  // Cafe & Restaurant lists
  const cafeLists = [
    {
      title: 'بهترین کافه‌های تهران',
      slug: 'best-cafes-tehran',
      description: 'دنج‌ترین و با کیفیت‌ترین کافه‌های پایتخت',
      categoryId: cafeCategory.id,
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      title: 'رستوران‌های غذای ایرانی اصیل',
      slug: 'authentic-persian-restaurants',
      description: 'بهترین رستوران‌ها برای تجربه طعم اصیل غذای ایرانی',
      categoryId: cafeCategory.id,
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      title: 'کافه‌های مناسب دورهمی',
      slug: 'cafes-for-gatherings',
      description: 'کافه‌هایی با فضای مناسب برای جمع‌های دوستانه',
      categoryId: cafeCategory.id,
      badge: null,
      isFeatured: false,
    },
    {
      title: 'رستوران‌های فست‌فود و برگر',
      slug: 'fastfood-burger-restaurants',
      description: 'بهترین برگرها و فست‌فودهای شهر',
      categoryId: cafeCategory.id,
      badge: 'NEW',
      isFeatured: false,
    },
    {
      title: 'کافه‌های کتاب‌خانه‌دار',
      slug: 'book-cafes',
      description: 'کافه‌هایی با قفسه کتاب برای مطالعه و کار',
      categoryId: cafeCategory.id,
      badge: 'FEATURED',
      isFeatured: true,
    },
  ];

  const allLists = [...bookLists, ...cafeLists];

  for (const listData of allLists) {
    try {
      const existingList = await prisma.list.findUnique({
        where: { slug: listData.slug }
      });

      if (existingList) {
        console.log(`⚠️  لیست "${listData.title}" قبلاً وجود دارد`);
        continue;
      }

      const list = await prisma.list.create({
        data: {
          title: listData.title,
          slug: listData.slug,
          description: listData.description,
          categoryId: listData.categoryId,
          userId: adminUser.id,
          badge: listData.badge as any,
          isPublic: true,
          isFeatured: listData.isFeatured,
          isActive: true,
        },
      });

      console.log(`✅ لیست ایجاد شد: ${list.title}`);
    } catch (error) {
      console.error(`❌ خطا در ایجاد لیست "${listData.title}":`, error);
    }
  }

  console.log('\n✨ عملیات با موفقیت انجام شد!\n');

  // Show final statistics
  const stats = await prisma.category.findMany({
    include: {
      _count: { select: { lists: true } }
    },
    orderBy: { order: 'asc' }
  });

  console.log('📊 آمار نهایی:\n');
  stats.forEach((cat) => {
    if (cat.isActive) {
      console.log(`${cat.icon} ${cat.name}: ${cat._count.lists} لیست`);
    }
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
