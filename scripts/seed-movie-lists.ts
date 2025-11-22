import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // First, find or create the Movie category
  let movieCategory = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: 'movie' },
        { slug: 'film' },
        { name: { contains: 'فیلم' } }
      ]
    }
  });

  if (!movieCategory) {
    movieCategory = await prisma.category.create({
      data: {
        name: 'فیلم و سریال',
        slug: 'movie',
        icon: '🎬',
        color: '#E50914',
        description: 'بهترین فیلم‌ها و سریال‌ها',
        order: 0,
        isActive: true,
      },
    });
    console.log('✅ دسته‌بندی فیلم و سریال ایجاد شد');
  } else {
    console.log('✅ دسته‌بندی فیلم و سریال موجود است');
  }

  // Find admin user
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.error('❌ کاربر ادمین یافت نشد');
    return;
  }

  console.log(`✅ کاربر ادمین یافت شد: ${adminUser.email}`);

  // Create 10 movie lists
  const movieLists = [
    {
      title: 'بهترین فیلم‌های اکشن 2024',
      slug: 'best-action-movies-2024',
      description: 'جذاب‌ترین و پرهیجان‌ترین فیلم‌های اکشن سال 2024',
      badge: 'NEW',
      isFeatured: true,
    },
    {
      title: 'سریال‌های درام برتر',
      slug: 'top-drama-series',
      description: 'احساسی‌ترین و تاثیرگذارترین سریال‌های درام',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      title: 'فیلم‌های کمدی خانوادگی',
      slug: 'family-comedy-movies',
      description: 'خنده‌دارترین فیلم‌ها برای تماشا با خانواده',
      badge: null,
      isFeatured: false,
    },
    {
      title: 'سریال‌های علمی-تخیلی باورنکردنی',
      slug: 'amazing-scifi-series',
      description: 'دنیاهای جدید و داستان‌های شگفت‌انگیز علمی-تخیلی',
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      title: 'فیلم‌های ترسناک برتر تاریخ',
      slug: 'best-horror-movies-ever',
      description: 'وحشتناک‌ترین فیلم‌هایی که تا به حال ساخته شده‌اند',
      badge: null,
      isFeatured: false,
    },
    {
      title: 'سریال‌های جنایی و معمایی',
      slug: 'crime-mystery-series',
      description: 'پیچیده‌ترین و هیجان‌انگیزترین سریال‌های جنایی',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      title: 'فیلم‌های انیمیشن برای بزرگسالان',
      slug: 'adult-animation-movies',
      description: 'انیمیشن‌های عمیق و هنری برای تماشاگران بالغ',
      badge: null,
      isFeatured: false,
    },
    {
      title: 'سریال‌های تاریخی حماسی',
      slug: 'epic-historical-series',
      description: 'بزرگ‌ترین داستان‌های تاریخی روی پرده',
      badge: null,
      isFeatured: false,
    },
    {
      title: 'فیلم‌های رمانتیک احساسی',
      slug: 'romantic-emotional-movies',
      description: 'عاشقانه‌ترین داستان‌های عشقی سینما',
      badge: 'NEW',
      isFeatured: false,
    },
    {
      title: 'سریال‌های کره‌ای پرطرفدار',
      slug: 'popular-korean-dramas',
      description: 'محبوب‌ترین سریال‌های کره‌ای (K-Drama)',
      badge: 'TRENDING',
      isFeatured: true,
    },
  ];

  console.log('\n🎬 در حال ایجاد لیست‌های فیلم و سریال...\n');

  for (const listData of movieLists) {
    try {
      // Check if list already exists
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
          categoryId: movieCategory.id,
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

  console.log('\n✨ تمام لیست‌ها با موفقیت ایجاد شدند!\n');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
