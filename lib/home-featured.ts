/**
 * منطق «منتخب هفته» هوم موبایل با زمان‌بندی اسلات.
 * - منتخب فعلی = اسلات فعال (startAt <= now و endAt null یا > now) یا آخرین اسلات منقضی‌شده اگر بعدی نباشد.
 * - در حالت «بدون اسلات بعدی» یک‌بار نوتیف برای ادمین‌ها ساخته می‌شود.
 */

import type { PrismaClient } from '@prisma/client';
import { createNotification } from '@/lib/utils/notifications';

export type FeaturedSlotResult = {
  slotId: string;
  listId: string;
  list: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    saveCount: number;
    itemCount: number;
    likeCount: number;
    categories: { id: string; name: string; slug: string; icon: string } | null;
    users: { id: string; name: string | null; username: string | null } | null;
  };
  startAt: Date;
  endAt: Date | null;
};

/**
 * اسلات فعال = startAt <= now و (endAt null یا endAt > now).
 * اگر هیچ اسلات فعالی نبود: آخرین اسلات منقضی‌شده (endAt < now) را برمی‌گرداند و در همان لحظه اگر قبلاً نوتیف نساختیم، برای ادمین‌ها نوتیف می‌سازد.
 * اگر هیچ اسلاتی در تاریخچه نبود: null (caller از fallback isFeatured استفاده کند).
 */
export async function getCurrentFeaturedSlot(
  prisma: PrismaClient
): Promise<FeaturedSlotResult | null> {
  const now = new Date();

  const activeSlot = await prisma.home_featured_slot.findFirst({
    where: {
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    orderBy: { startAt: 'desc' },
    include: {
      lists: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          saveCount: true,
          itemCount: true,
          likeCount: true,
          categories: { select: { id: true, name: true, slug: true, icon: true } },
          users: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });

  if (activeSlot?.lists) {
    return {
      slotId: activeSlot.id,
      listId: activeSlot.listId,
      list: activeSlot.lists,
      startAt: activeSlot.startAt,
      endAt: activeSlot.endAt,
    };
  }

  const lastExpiredSlot = await prisma.home_featured_slot.findFirst({
    where: { endAt: { lt: now } },
    orderBy: { endAt: 'desc' },
    include: {
      lists: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          saveCount: true,
          itemCount: true,
          likeCount: true,
          categories: { select: { id: true, name: true, slug: true, icon: true } },
          users: { select: { id: true, name: true, username: true } },
        },
      },
    },
  });

  if (lastExpiredSlot?.lists) {
    try {
      await ensureAdminFeaturedNoNextNotification(prisma, lastExpiredSlot.id);
    } catch (err) {
      console.warn('ensureAdminFeaturedNoNextNotification failed:', err);
    }
    return {
      slotId: lastExpiredSlot.id,
      listId: lastExpiredSlot.listId,
      list: lastExpiredSlot.lists,
      startAt: lastExpiredSlot.startAt,
      endAt: lastExpiredSlot.endAt,
    };
  }

  return null;
}

/** یک‌بار به ازای هر اسلات منقضی‌شده نوتیف «منتخب بعدی تعیین نشده» برای ADMIN/SUPER_ADMIN */
async function ensureAdminFeaturedNoNextNotification(
  prisma: PrismaClient,
  slotId: string
): Promise<void> {
  const existing = await prisma.admin_featured_notification_sent.findUnique({
    where: { slotId },
  });
  if (existing) return;

  const adminUsers = await prisma.users.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
    select: { id: true },
  });

  const title = 'منتخب بعدی تعیین نشده';
  const message = 'اسلات منتخب هفته تمام شده و اسلات بعدی تعریف نشده است. از بخش کاستوم > مدیریت منتخب‌ها اسلات جدید اضافه کنید.';
  const link = '/admin/custom/featured';

  await Promise.all([
    ...adminUsers.map((u) =>
      createNotification(u.id, 'admin_featured_no_next', title, message, link)
    ),
    prisma.admin_featured_notification_sent.create({
      data: { slotId },
    }),
  ]);
}

export type HomeFeaturedAction = 'VIEW_LIST' | 'QUICK_SAVE';

/** ثبت رویداد کلیک (مشاهده لیست / ذخیره سریع). userId اختیاری برای مهمان. */
export async function trackFeaturedEvent(
  prisma: PrismaClient,
  params: { slotId: string; listId: string; action: HomeFeaturedAction; userId?: string | null }
): Promise<void> {
  const actionEnum = params.action === 'VIEW_LIST' ? 'VIEW_LIST' : 'QUICK_SAVE';
  await prisma.home_featured_event.create({
    data: {
      slotId: params.slotId,
      listId: params.listId,
      action: actionEnum,
      userId: params.userId ?? null,
    },
  });
}
