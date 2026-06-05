import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const adminUser = await prisma.users.upsert({
    where: { email: '989121941532@phone.wibe' },
    update: { password: hashedPassword, role: 'ADMIN', updatedAt: new Date() },
    create: {
      id: nanoid(),
      email: '989121941532@phone.wibe',
      name: 'رام',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // 2. Create Categories
  console.log('\nCreating categories...');
  const categories = [
    {
      id: nanoid(),
      name: 'فیلم و سریال',
      slug: 'movies',
      icon: '🎬',
      color: '#8B5CF6',
      description: 'بهترین فیلم‌ها و سریال‌های پیشنهادی',
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: nanoid(),
      name: 'کتاب',
      slug: 'books',
      icon: '📚',
      color: '#F59E0B',
      description: 'کتاب‌های پیشنهادی در انواع ژانرها',
      order: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: nanoid(),
      name: 'کافه و رستوران',
      slug: 'cafe',
      icon: '☕',
      color: '#F59E0B',
      description: 'بهترین کافه‌ها و رستوران‌های شهر',
      order: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: nanoid(),
      name: 'پادکست',
      slug: 'podcast',
      icon: '🎧',
      color: '#EC4899',
      description: 'پادکست‌های جذاب و آموزنده',
      order: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: nanoid(),
      name: 'لایف‌استایل',
      slug: 'lifestyle',
      icon: '🌱',
      color: '#10B981',
      description: 'محصولات و توصیه‌های لایف‌استایل',
      order: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: nanoid(),
      name: 'ماشین و تکنولوژی',
      slug: 'car',
      icon: '🚗',
      color: '#EF4444',
      description: 'ماشین‌ها و فناوری‌های جدید',
      order: 6,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const createdCategories = await Promise.all(
    categories.map((cat) =>
      prisma.categories.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );
  console.log(`✅ ${createdCategories.length} categories created`);

  // 3. Create Lists
  console.log('\nCreating lists...');

  const movieCategoryId = createdCategories.find((c) => c.slug === 'movies').id;
  const bookCategoryId = createdCategories.find((c) => c.slug === 'books').id;
  const cafeCategoryId = createdCategories.find((c) => c.slug === 'cafe').id;

  const listsData = [
    // فیلم و سریال (10 لیست)
    {
      categoryId: movieCategoryId,
      title: 'بهترین فیلم‌های عاشقانه ۲۰۲۵',
      slug: 'best-romantic-movies-2025',
      description: 'لیست کامل فیلم‌های عاشقانه سال ۲۰۲۵ که باید ببینی',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های قبل خواب',
      slug: 'movies-before-sleep',
      description: 'فیلم‌های آرامش‌بخش برای تماشای قبل از خواب',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'سریال‌های کره‌ای must-watch',
      slug: 'korean-dramas-must-watch',
      description: 'بهترین سریال‌های کره‌ای که باید تماشا کنید',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'NEW',
      isFeatured: true,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های انیمیشن استودیو جیبلی',
      slug: 'studio-ghibli-animations',
      description: 'شاهکارهای انیمیشن استودیو جیبلی',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'بهترین تریلرهای روانشناختی',
      slug: 'psychological-thrillers',
      description: 'تریلرهای روانشناختی که ذهن شما را به چالش می‌کشند',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های کمدی خانوادگی',
      slug: 'family-comedy-movies',
      description: 'فیلم‌های کمدی مناسب برای تماشای خانوادگی',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'سریال‌های علمی-تخیلی برتر',
      slug: 'top-scifi-series',
      description: 'بهترین سریال‌های علمی-تخیلی تاریخ تلویزیون',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های سینمای ایران',
      slug: 'iranian-cinema',
      description: 'بهترین فیلم‌های سینمای ایران در تاریخ',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'مستند‌های الهام‌بخش',
      slug: 'inspiring-documentaries',
      description: 'مستندهایی که زندگی شما را تغییر می‌دهند',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های اکشن دهه 90',
      slug: '90s-action-movies',
      description: 'بهترین فیلم‌های اکشن دهه 90 میلادی',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },

    // کتاب (10 لیست)
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های توسعه فردی',
      slug: 'personal-development-books',
      description: 'بهترین کتاب‌ها برای رشد شخصی و حرفه‌ای',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      categoryId: bookCategoryId,
      title: 'رمان‌های عاشقانه برتر',
      slug: 'top-romance-novels',
      description: 'رمان‌های عاشقانه که قلب شما را به تپش می‌اندازند',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های خواب‌آور',
      slug: 'sleep-inducing-books',
      description: 'کتاب‌هایی برای خواندن قبل از خواب',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'NEW',
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های روانشناسی کاربردی',
      slug: 'applied-psychology-books',
      description: 'روانشناسی عملی برای زندگی بهتر',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'رمان‌های فانتزی epic',
      slug: 'epic-fantasy-novels',
      description: 'بهترین رمان‌های فانتزی حماسی جهان',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های کسب‌وکار و استارتاپ',
      slug: 'business-startup-books',
      description: 'کتاب‌های ضروری برای کارآفرینان',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های فلسفی ساده',
      slug: 'simple-philosophy-books',
      description: 'فلسفه به زبان ساده برای همه',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'رمان‌های معمایی و جنایی',
      slug: 'mystery-crime-novels',
      description: 'رمان‌های جنایی که شما را به صندلی می‌چسبانند',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های تاریخی جذاب',
      slug: 'fascinating-history-books',
      description: 'تاریخ به روایتی جذاب و خواندنی',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'شعر و ادبیات معاصر ایران',
      slug: 'contemporary-persian-literature',
      description: 'بهترین آثار شعر و ادبیات معاصر فارسی',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },

    // کافه و رستوران (10 لیست)
    {
      categoryId: cafeCategoryId,
      title: 'بهترین کافه‌های روباز تهران',
      slug: 'best-outdoor-cafes-tehran',
      description: 'کافه‌های دنج و زیبا برای یک عصر دل‌انگیز در تهران',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های غذای ایرانی سنتی',
      slug: 'traditional-iranian-restaurants',
      description: 'بهترین رستوران‌های غذای اصیل ایرانی',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های دنج برای مطالعه',
      slug: 'cozy-cafes-for-studying',
      description: 'کافه‌های آرام و مناسب برای مطالعه و کار',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'NEW',
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های ایتالیایی اصیل',
      slug: 'authentic-italian-restaurants',
      description: 'طعم اصیل ایتالیا در تهران',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های اینستاگرامی',
      slug: 'instagrammable-cafes',
      description: 'کافه‌های زیبا و مناسب عکس گرفتن',
      coverImage: '/images/placeholder-cover.svg',
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های فست‌فود کیفیتی',
      slug: 'quality-fast-food-restaurants',
      description: 'فست‌فودهای باکیفیت و سالم',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های با view زیبا',
      slug: 'cafes-with-great-views',
      description: 'کافه‌هایی با چشم‌انداز فوق‌العاده',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های گیاهخواری تهران',
      slug: 'vegan-vegetarian-restaurants-tehran',
      description: 'بهترین رستوران‌های گیاهی و وگان',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های صبحانه عالی',
      slug: 'great-breakfast-cafes',
      description: 'بهترین جاها برای صبحانه در تهران',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های دریایی و ماهی',
      slug: 'seafood-restaurants',
      description: 'بهترین رستوران‌های غذاهای دریایی و ماهی',
      coverImage: '/images/placeholder-cover.svg',
      badge: null,
      isFeatured: false,
    },
  ];

  let createdListsCount = 0;
  for (const listData of listsData) {
    await prisma.lists.create({
      data: {
        id: nanoid(),
        ...listData,
        userId: adminUser.id,
        isPublic: true,
        isActive: true,
        viewCount: Math.floor(Math.random() * 500) + 50,
        likeCount: Math.floor(Math.random() * 200) + 20,
        saveCount: Math.floor(Math.random() * 100) + 10,
        itemCount: Math.floor(Math.random() * 15) + 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    createdListsCount++;
  }
  console.log(`✅ ${createdListsCount} lists created`);

  // 4. Create Settings Entry
  console.log('\nCreating settings entry...');
  await prisma.settings.upsert({
    where: { id: 'settings' },
    update: {},
    create: {
      id: 'settings',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Settings entry created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Admin Login:');
  console.log('   Phone: 09121941532');
  console.log('   Password: 123456');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
