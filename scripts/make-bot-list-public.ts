import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeBotListPublic() {
  try {
    console.log('🔓 در حال عمومی کردن لیست bot...\n');

    // پیدا کردن لیست bot
    const botList = await prisma.lists.findFirst({
      where: {
        title: 'لیست شخصی تست',
        users: {
          OR: [
            { email: { contains: 'bot', mode: 'insensitive' } },
            { name: { contains: 'bot', mode: 'insensitive' } },
          ],
        },
      },
      include: {
        users: true,
      },
    });

    if (!botList) {
      console.log('❌ لیست bot یافت نشد!');
      return;
    }

    console.log(`✅ لیست پیدا شد: ${botList.title}`);
    console.log(`   - کاربر: ${botList.users.name || botList.users.email}`);
    console.log(`   - تعداد آیتم‌ها: ${botList.itemCount}`);
    console.log(`   - وضعیت فعلی: ${botList.isPublic ? 'عمومی' : 'شخصی'}\n`);

    // بررسی حداقل تعداد آیتم‌ها
    const settings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    });
    const minItems = settings?.minItemsForPublicList || 5;

    if (botList.itemCount < minItems) {
      console.log(`⚠️  لیست باید حداقل ${minItems} آیتم داشته باشد برای عمومی شدن.`);
      console.log(`   تعداد فعلی: ${botList.itemCount}`);
      return;
    }

    // عمومی کردن لیست
    await prisma.lists.update({
      where: { id: botList.id },
      data: {
        isPublic: true,
      },
    });

    console.log(`✅ لیست "${botList.title}" با موفقیت عمومی شد!`);
    console.log(`\n📋 اطلاعات لیست:`);
    console.log(`   - ID: ${botList.id}`);
    console.log(`   - Slug: ${botList.slug}`);
    console.log(`   - عمومی: بله`);
    console.log(`   - فعال: ${botList.isActive ? 'بله' : 'خیر'}`);
    console.log(`   - تعداد آیتم‌ها: ${botList.itemCount}`);
  } catch (error) {
    console.error('❌ خطا:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeBotListPublic();

