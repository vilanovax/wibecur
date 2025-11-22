import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@listhub.ir' },
    update: {},
    create: {
      id: nanoid(),
      email: 'admin@listhub.ir',
      name: 'رام',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
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

  const movieCategoryId = createdCategories.find((c) => c.slug === 'movies')!.id;
  const bookCategoryId = createdCategories.find((c) => c.slug === 'books')!.id;
  const cafeCategoryId = createdCategories.find((c) => c.slug === 'cafe')!.id;

  const listsData = [
    // فیلم و سریال (10 لیست)
    {
      categoryId: movieCategoryId,
      title: 'بهترین فیلم‌های عاشقانه ۲۰۲۵',
      slug: 'best-romantic-movies-2025',
      description: 'لیست کامل فیلم‌های عاشقانه سال ۲۰۲۵ که باید ببینی',
      coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=400&fit=crop',
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های قبل خواب',
      slug: 'movies-before-sleep',
      description: 'فیلم‌های آرامش‌بخش برای تماشای قبل از خواب',
      coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'سریال‌های کره‌ای must-watch',
      slug: 'korean-dramas-must-watch',
      description: 'بهترین سریال‌های کره‌ای که باید تماشا کنید',
      coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=200&fit=crop',
      badge: 'NEW',
      isFeatured: true,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های انیمیشن استودیو جیبلی',
      slug: 'studio-ghibli-animations',
      description: 'شاهکارهای انیمیشن استودیو جیبلی',
      coverImage: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'بهترین تریلرهای روانشناختی',
      slug: 'psychological-thrillers',
      description: 'تریلرهای روانشناختی که ذهن شما را به چالش می‌کشند',
      coverImage: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های کمدی خانوادگی',
      slug: 'family-comedy-movies',
      description: 'فیلم‌های کمدی مناسب برای تماشای خانوادگی',
      coverImage: 'https://images.unsplash.com/photo-1574267432644-f794422d36ba?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'سریال‌های علمی-تخیلی برتر',
      slug: 'top-scifi-series',
      description: 'بهترین سریال‌های علمی-تخیلی تاریخ تلویزیون',
      coverImage: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=200&fit=crop',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های سینمای ایران',
      slug: 'iranian-cinema',
      description: 'بهترین فیلم‌های سینمای ایران در تاریخ',
      coverImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'مستند‌های الهام‌بخش',
      slug: 'inspiring-documentaries',
      description: 'مستندهایی که زندگی شما را تغییر می‌دهند',
      coverImage: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: movieCategoryId,
      title: 'فیلم‌های اکشن دهه 90',
      slug: '90s-action-movies',
      description: 'بهترین فیلم‌های اکشن دهه 90 میلادی',
      coverImage: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },

    // کتاب (10 لیست)
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های توسعه فردی',
      slug: 'personal-development-books',
      description: 'بهترین کتاب‌ها برای رشد شخصی و حرفه‌ای',
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=200&fit=crop',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      categoryId: bookCategoryId,
      title: 'رمان‌های عاشقانه برتر',
      slug: 'top-romance-novels',
      description: 'رمان‌های عاشقانه که قلب شما را به تپش می‌اندازند',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های خواب‌آور',
      slug: 'sleep-inducing-books',
      description: 'کتاب‌هایی برای خواندن قبل از خواب',
      coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop',
      badge: 'NEW',
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های روانشناسی کاربردی',
      slug: 'applied-psychology-books',
      description: 'روانشناسی عملی برای زندگی بهتر',
      coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'رمان‌های فانتزی epic',
      slug: 'epic-fantasy-novels',
      description: 'بهترین رمان‌های فانتزی حماسی جهان',
      coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های کسب‌وکار و استارتاپ',
      slug: 'business-startup-books',
      description: 'کتاب‌های ضروری برای کارآفرینان',
      coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های فلسفی ساده',
      slug: 'simple-philosophy-books',
      description: 'فلسفه به زبان ساده برای همه',
      coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'رمان‌های معمایی و جنایی',
      slug: 'mystery-crime-novels',
      description: 'رمان‌های جنایی که شما را به صندلی می‌چسبانند',
      coverImage: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'کتاب‌های تاریخی جذاب',
      slug: 'fascinating-history-books',
      description: 'تاریخ به روایتی جذاب و خواندنی',
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: bookCategoryId,
      title: 'شعر و ادبیات معاصر ایران',
      slug: 'contemporary-persian-literature',
      description: 'بهترین آثار شعر و ادبیات معاصر فارسی',
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },

    // کافه و رستوران (10 لیست)
    {
      categoryId: cafeCategoryId,
      title: 'بهترین کافه‌های روباز تهران',
      slug: 'best-outdoor-cafes-tehran',
      description: 'کافه‌های دنج و زیبا برای یک عصر دل‌انگیز در تهران',
      coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=200&fit=crop',
      badge: 'FEATURED',
      isFeatured: true,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های غذای ایرانی سنتی',
      slug: 'traditional-iranian-restaurants',
      description: 'بهترین رستوران‌های غذای اصیل ایرانی',
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های دنج برای مطالعه',
      slug: 'cozy-cafes-for-studying',
      description: 'کافه‌های آرام و مناسب برای مطالعه و کار',
      coverImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=200&fit=crop',
      badge: 'NEW',
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های ایتالیایی اصیل',
      slug: 'authentic-italian-restaurants',
      description: 'طعم اصیل ایتالیا در تهران',
      coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های اینستاگرامی',
      slug: 'instagrammable-cafes',
      description: 'کافه‌های زیبا و مناسب عکس گرفتن',
      coverImage: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=200&fit=crop',
      badge: 'TRENDING',
      isFeatured: true,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های فست‌فود کیفیتی',
      slug: 'quality-fast-food-restaurants',
      description: 'فست‌فودهای باکیفیت و سالم',
      coverImage: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های با view زیبا',
      slug: 'cafes-with-great-views',
      description: 'کافه‌هایی با چشم‌انداز فوق‌العاده',
      coverImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های گیاهخواری تهران',
      slug: 'vegan-vegetarian-restaurants-tehran',
      description: 'بهترین رستوران‌های گیاهی و وگان',
      coverImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'کافه‌های صبحانه عالی',
      slug: 'great-breakfast-cafes',
      description: 'بهترین جاها برای صبحانه در تهران',
      coverImage: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400&h=200&fit=crop',
      badge: null,
      isFeatured: false,
    },
    {
      categoryId: cafeCategoryId,
      title: 'رستوران‌های دریایی و ماهی',
      slug: 'seafood-restaurants',
      description: 'بهترین رستوران‌های غذاهای دریایی و ماهی',
      coverImage: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=200&fit=crop',
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
    },
  });
  console.log('✅ Settings entry created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Admin Login:');
  console.log('   Email: admin@listhub.ir');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
