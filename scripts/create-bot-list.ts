import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/utils/slug';

const prisma = new PrismaClient();

// تصاویر placeholder
const placeholderImages = [
  'https://via.placeholder.com/800x600/6366f1/ffffff?text=Item',
  'https://via.placeholder.com/800x600/8b5cf6/ffffff?text=Item',
  'https://via.placeholder.com/800x600/ec4899/ffffff?text=Item',
  'https://via.placeholder.com/800x600/f59e0b/ffffff?text=Item',
  'https://via.placeholder.com/800x600/10b981/ffffff?text=Item',
];

async function createBotList() {
  try {
    console.log('🚀 شروع ایجاد لیست شخصی برای کاربر bot...\n');

    // پیدا کردن یا ایجاد کاربر bot
    let botUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'bot', mode: 'insensitive' } },
          { name: { contains: 'bot', mode: 'insensitive' } },
        ],
      },
    });

    if (!botUser) {
      console.log('❌ کاربر bot یافت نشد. لطفاً ابتدا یک کاربر bot ایجاد کنید.');
      return;
    }

    console.log(`✅ کاربر bot پیدا شد: ${botUser.name || botUser.email}\n`);

    // دریافت یک دسته فعال
    const category = await prisma.categories.findFirst({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (!category) {
      console.log('❌ هیچ دسته فعالی یافت نشد!');
      return;
    }

    console.log(`📂 دسته انتخاب شده: ${category.name}\n`);

    // ایجاد لیست شخصی
    const listTitle = 'لیست شخصی تست';
    let listSlug = slugify(listTitle);

    // بررسی یکتا بودن slug
    let existingList = await prisma.lists.findUnique({
      where: { slug: listSlug },
    });

    if (existingList || !listSlug || listSlug.trim() === '') {
      listSlug = `bot-list-${Date.now()}`;
    }

    const newList = await prisma.lists.create({
      data: {
        id: nanoid(),
        title: listTitle,
        slug: listSlug,
        description: 'این یک لیست شخصی تست است که توسط کاربر bot ایجاد شده است.',
        categoryId: category.id,
        userId: botUser.id,
        isPublic: false, // لیست شخصی، هنوز عمومی نشده
        isActive: true,
        commentsEnabled: true,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ لیست شخصی ایجاد شد: ${newList.title} (${newList.id})\n`);

    // ایجاد 5 آیتم
    const itemsData = [
      {
        title: 'آیتم تست 1',
        description: 'توضیحات آیتم تست 1 - این یک آیتم نمونه است.',
        metadata: {},
      },
      {
        title: 'آیتم تست 2',
        description: 'توضیحات آیتم تست 2 - این یک آیتم نمونه است.',
        metadata: {},
      },
      {
        title: 'آیتم تست 3',
        description: 'توضیحات آیتم تست 3 - این یک آیتم نمونه است.',
        metadata: {},
      },
      {
        title: 'آیتم تست 4',
        description: 'توضیحات آیتم تست 4 - این یک آیتم نمونه است.',
        metadata: {},
      },
      {
        title: 'آیتم تست 5',
        description: 'توضیحات آیتم تست 5 - این یک آیتم نمونه است.',
        metadata: {},
      },
    ];

    console.log('📝 در حال ایجاد 5 آیتم...\n');

    for (let i = 0; i < itemsData.length; i++) {
      const itemData = itemsData[i];
      const imageUrl = placeholderImages[i % placeholderImages.length] + `+bot-${i + 1}`;

      try {
        await prisma.items.create({
          data: {
            id: nanoid(),
            title: itemData.title,
            description: itemData.description,
            imageUrl,
            listId: newList.id,
            order: i,
            metadata: itemData.metadata,
            commentsEnabled: true,
            updatedAt: new Date(),
          },
        });

        console.log(`  ✅ ${itemData.title}`);
      } catch (error: any) {
        console.error(`  ❌ خطا در ایجاد "${itemData.title}": ${error.message}`);
      }
    }

    // به‌روزرسانی تعداد آیتم‌های لیست
    await prisma.lists.update({
      where: { id: newList.id },
      data: {
        itemCount: 5,
      },
    });

    console.log(`\n✨ کار تمام شد! لیست شخصی "${newList.title}" با 5 آیتم ایجاد شد.`);
    console.log(`\n📋 اطلاعات لیست:`);
    console.log(`   - ID: ${newList.id}`);
    console.log(`   - Slug: ${newList.slug}`);
    console.log(`   - کاربر: ${botUser.name || botUser.email}`);
    console.log(`   - دسته: ${category.name}`);
    console.log(`   - تعداد آیتم‌ها: 5`);
    console.log(`   - عمومی: ${newList.isPublic ? 'بله' : 'خیر'}`);
  } catch (error) {
    console.error('❌ خطا:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBotList();

