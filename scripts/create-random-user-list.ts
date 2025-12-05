import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { slugify } from '@/lib/utils/slug';

const prisma = new PrismaClient();

async function createRandomUserList() {
  try {
    console.log('🚀 شروع ایجاد لیست شخصی رندوم...\n');

    // پیدا کردن یک کاربر رندوم با role USER
    const users = await prisma.users.findMany({
      where: {
        role: 'USER',
        isActive: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ هیچ کاربر USER فعالی یافت نشد!');
      return;
    }

    // انتخاب کاربر رندوم
    const randomUser = users[Math.floor(Math.random() * users.length)];
    console.log(`✅ کاربر انتخاب شده: ${randomUser.name || randomUser.email} (${randomUser.id})\n`);

    // دریافت یک دسته فعال
    const categories = await prisma.categories.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    if (categories.length === 0) {
      console.log('❌ هیچ دسته فعالی یافت نشد!');
      return;
    }

    // انتخاب دسته رندوم
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    console.log(`📂 دسته انتخاب شده: ${randomCategory.name} (${randomCategory.id})\n`);

    // دریافت 7 آیتم رندوم از دیتابیس
    const allItems = await prisma.items.findMany({
      where: {
        lists: {
          isActive: true,
        },
      },
      take: 100, // دریافت تعداد بیشتری برای انتخاب رندوم بهتر
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (allItems.length === 0) {
      console.log('❌ هیچ آیتمی در دیتابیس یافت نشد!');
      return;
    }

    // انتخاب 7 آیتم رندوم
    const selectedItems = [];
    const itemsCopy = [...allItems];
    
    for (let i = 0; i < 7 && itemsCopy.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * itemsCopy.length);
      selectedItems.push(itemsCopy[randomIndex]);
      itemsCopy.splice(randomIndex, 1); // حذف آیتم انتخاب شده برای جلوگیری از تکرار
    }

    console.log(`📦 ${selectedItems.length} آیتم رندوم انتخاب شد:\n`);
    selectedItems.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`);
    });
    console.log('');

    // ایجاد عنوان لیست
    const listTitle = `لیست ${randomCategory.name} - ${randomUser.name || 'کاربر'}`;
    let listSlug = slugify(listTitle);

    // بررسی یکتا بودن slug
    let existingList = await prisma.lists.findUnique({
      where: { slug: listSlug },
    });

    if (existingList || !listSlug || listSlug.trim() === '') {
      listSlug = `user-list-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    // ایجاد لیست شخصی
    const newList = await prisma.lists.create({
      data: {
        id: nanoid(),
        title: listTitle,
        slug: listSlug,
        description: `این لیستی است که توسط ${randomUser.name || randomUser.email} ایجاد شده و شامل ${selectedItems.length} آیتم انتخاب شده از دیتابیس می‌باشد.`,
        categoryId: randomCategory.id,
        userId: randomUser.id,
        isPublic: true, // عمومی می‌کنیم چون 7 آیتم دارد (بیشتر از 5)
        isActive: true,
        commentsEnabled: true,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ لیست شخصی ایجاد شد: ${newList.title} (${newList.id})\n`);

    // کپی کردن آیتم‌های انتخاب شده به لیست جدید
    console.log('📝 در حال افزودن آیتم‌ها به لیست...\n');

    let addedCount = 0;
    for (let i = 0; i < selectedItems.length; i++) {
      const originalItem = selectedItems[i];

      try {
        // Check if item with same title already exists in this list
        const existingItem = await prisma.items.findFirst({
          where: {
            listId: newList.id,
            title: {
              equals: originalItem.title,
              mode: 'insensitive',
            },
          },
        });

        if (existingItem) {
          console.log(`  ⚠️  ${i + 1}. "${originalItem.title}" - رد شد (تکراری)`);
          continue;
        }

        await prisma.items.create({
          data: {
            id: nanoid(),
            title: originalItem.title,
            description: originalItem.description,
            imageUrl: originalItem.imageUrl,
            externalUrl: originalItem.externalUrl,
            listId: newList.id,
            order: addedCount,
            metadata: originalItem.metadata || {},
            commentsEnabled: originalItem.commentsEnabled !== undefined ? originalItem.commentsEnabled : true,
            maxComments: originalItem.maxComments || null,
            voteCount: 0,
            rating: 0,
            updatedAt: new Date(),
          },
        });

        console.log(`  ✅ ${addedCount + 1}. ${originalItem.title}`);
        addedCount++;
      } catch (error: any) {
        console.error(`  ❌ خطا در افزودن "${originalItem.title}": ${error.message}`);
      }
    }

    // به‌روزرسانی تعداد آیتم‌های لیست
    await prisma.lists.update({
      where: { id: newList.id },
      data: {
        itemCount: addedCount,
      },
    });

    console.log(`\n✨ کار تمام شد! لیست شخصی "${newList.title}" با ${addedCount} آیتم ایجاد شد.`);
    console.log(`\n📋 اطلاعات لیست:`);
    console.log(`   - ID: ${newList.id}`);
    console.log(`   - Slug: ${newList.slug}`);
    console.log(`   - کاربر: ${randomUser.name || randomUser.email}`);
    console.log(`   - دسته: ${randomCategory.name}`);
    console.log(`   - تعداد آیتم‌ها: ${addedCount} (از ${selectedItems.length} آیتم انتخاب شده)`);
    console.log(`   - عمومی: ${newList.isPublic ? 'بله' : 'خیر'}`);
    console.log(`   - فعال: ${newList.isActive ? 'بله' : 'خیر'}`);
  } catch (error) {
    console.error('❌ خطا:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createRandomUserList();

