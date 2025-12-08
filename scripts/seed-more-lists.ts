import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('📚☕ در حال ایجاد 10 لیست جدید برای کتاب و کافه/رستوران...\n');

  // Find categories
  const bookCategory = await prisma.categories.findFirst({
    where: { slug: 'book' }
  });

  const cafeCategory = await prisma.categories.findFirst({
    where: { slug: 'cafe' }
  });

  // Find admin user
  const adminUser = await prisma.users.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser || !bookCategory || !cafeCategory) {
    console.error('❌ دسته‌بندی یا کاربر ادمین یافت نشد');
    return;
  }

  console.log(`✅ کاربر ادمین: ${adminUser.email}`);
  console.log(`✅ دسته‌بندی کتاب: ${bookCategory.name}`);
  console.log(`✅ دسته‌بندی کافه: ${cafeCategory.name}\n`);

  // 5 Book lists
  const bookLists = [
    {
      title: 'کتاب‌های علمی تخیلی برتر',
      slug: 'best-scifi-books',
      description: 'شاهکارهای علمی تخیلی که آینده را پیش‌بینی کردند',
      categoryId: bookCategory.id,
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      title: 'کتاب‌های فلسفه برای مبتدی‌ها',
      slug: 'philosophy-books-beginners',
      description: 'آشنایی با مفاهیم فلسفه از طریق کتاب‌های ساده',
      categoryId: bookCategory.id,
      badge: null,
      isFeatured: false,
    },
    {
      title: 'رمان‌های پلیسی و جنایی',
      slug: 'detective-crime-novels',
      description: 'هیجان‌انگیزترین رمان‌های پلیسی و جنایی',
      categoryId: bookCategory.id,
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      title: 'کتاب‌های خودشناسی و رشد فردی',
      slug: 'self-development-books',
      description: 'بهترین کتاب‌ها برای توسعه فردی و خودشناسی',
      categoryId: bookCategory.id,
      badge: 'NEW',
      isFeatured: false,
    },
    {
      title: 'کتاب‌های تاریخی ایران',
      slug: 'persian-history-books',
      description: 'شناخت تاریخ و فرهنگ ایران از طریق کتاب',
      categoryId: bookCategory.id,
      badge: null,
      isFeatured: false,
    },
  ];

  // 5 Cafe & Restaurant lists
  const cafeLists = [
    {
      title: 'کافه‌های روف‌تاپ تهران',
      slug: 'rooftop-cafes-tehran',
      description: 'کافه‌های بام با چشم‌انداز عالی شهر',
      categoryId: cafeCategory.id,
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      title: 'رستوران‌های ایتالیایی اصیل',
      slug: 'authentic-italian-restaurants',
      description: 'بهترین پیتزا و پاستاهای شهر',
      categoryId: cafeCategory.id,
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      title: 'کافه‌های ارزان قیمت و با کیفیت',
      slug: 'affordable-quality-cafes',
      description: 'کافه‌های خوب با قیمت مناسب',
      categoryId: cafeCategory.id,
      badge: null,
      isFeatured: false,
    },
    {
      title: 'رستوران‌های دریایی و ماهی',
      slug: 'seafood-restaurants',
      description: 'بهترین رستوران‌ها برای عاشقان غذاهای دریایی',
      categoryId: cafeCategory.id,
      badge: 'NEW',
      isFeatured: false,
    },
    {
      title: 'کافه‌های مناسب کار و مطالعه',
      slug: 'work-study-cafes',
      description: 'کافه‌های آرام با وای‌فای سریع برای کار کردن',
      categoryId: cafeCategory.id,
      badge: null,
      isFeatured: false,
    },
  ];

  const allLists = [...bookLists, ...cafeLists];

  let successCount = 0;
  let skipCount = 0;

  for (const listData of allLists) {
    try {
      const existingList = await prisma.lists.findUnique({
        where: { slug: listData.slug }
      });

      if (existingList) {
        console.log(`⚠️  لیست "${listData.title}" قبلاً وجود دارد`);
        skipCount++;
        continue;
      }

      const list = await prisma.lists.create({
        data: {
          id: nanoid(),
          title: listData.title,
          slug: listData.slug,
          description: listData.description,
          categoryId: listData.categoryId,
          userId: adminUser.id,
          badge: listData.badge as any,
          isPublic: true,
          isFeatured: listData.isFeatured,
          isActive: true,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ لیست ایجاد شد: ${list.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ خطا در ایجاد لیست "${listData.title}":`, error);
    }
  }

  console.log(`\n✨ ${successCount} لیست جدید با موفقیت ایجاد شد!`);
  if (skipCount > 0) {
    console.log(`⚠️  ${skipCount} لیست قبلاً وجود داشت\n`);
  }

  // Show final statistics
  const bookStats = await prisma.lists.count({
    where: { categoryId: bookCategory.id, isActive: true }
  });

  const cafeStats = await prisma.lists.count({
    where: { categoryId: cafeCategory.id, isActive: true }
  });

  console.log('📊 آمار نهایی:');
  console.log(`📚 کتاب: ${bookStats} لیست`);
  console.log(`☕ کافه و رستوران: ${cafeStats} لیست`);
  console.log(`🎯 جمع کل: ${bookStats + cafeStats} لیست\n`);
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
