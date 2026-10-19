/**
 * منطق «منتخب هفته» هوم موبایل با زمان‌بندی اسلات.
 * - منتخب فعلی = اسلات فعال (startAt <= now و endAt null یا > now) یا آخرین اسلات منقضی‌شده اگر بعدی نباشد.
 * - در حالت «بدون اسلات بعدی» یک‌بار نوتیف برای ادمین‌ها ساخته می‌شود.
 */

import type { PrismaClient } from '@prisma/client';
import { createNotification } from '@/lib/utils/notifications';
import { isListVisibleInPublicFeed } from '@/lib/public-content-filters';

export type FeaturedSlotResult = {
  slotId: string;
  listId: string;
  list: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    horizontalImage: string | null;
    saveCount: number;
    itemCount: number;
    likeCount: number;
    categories: { id: string; name: string; slug: string; icon: string; isActive: boolean } | null;
    users: { id: string; name: string | null; username: string | null } | null;
  };
  startAt: Date;
  endAt: Date | null;
};

const featuredListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverImage: true,
  horizontalImage: true,
  saveCount: true,
  itemCount: true,
  likeCount: true,
  categories: {
    select: { id: true, name: true, slug: true, icon: true, isActive: true },
  },
  users: { select: { id: true, name: true, username: true } },
} as const;

/**
 * Read-only current featured slot (no admin notification side effects).
 * Use on public home / cached paths so Data Cache never runs writes.
 */
export async function getCurrentFeaturedSlotReadOnly(
  prisma: PrismaClient
): Promise<FeaturedSlotResult | null> {
  const now = new Date();

  const activeSlot = await prisma.home_featured_slot.findFirst({
    where: {
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gt: now } }],
    },
    orderBy: { startAt: 'desc' },
    include: { lists: { select: featuredListSelect } },
  });

  if (activeSlot?.lists && isListVisibleInPublicFeed(activeSlot.lists)) {
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
    include: { lists: { select: featuredListSelect } },
  });

  if (lastExpiredSlot?.lists && isListVisibleInPublicFeed(lastExpiredSlot.lists)) {
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

/**
 * اسلات فعال = startAt <= now و (endAt null یا endAt > now).
 * اگر هیچ اسلات فعالی نبود: آخرین اسلات منقضی‌شده را برمی‌گرداند و در صورت نیاز نوتیف ادمین می‌سازد.
 * برای صفحهٔ خانه / کش از getCurrentFeaturedSlotReadOnly استفاده کن.
 */
export async function getCurrentFeaturedSlot(
  prisma: PrismaClient
): Promise<FeaturedSlotResult | null> {
  const result = await getCurrentFeaturedSlotReadOnly(prisma);
  if (!result) return null;

  const now = new Date();
  const isLive =
    result.startAt <= now &&
    (result.endAt == null || result.endAt > now);
  // نوتیف فقط برای fallback اسلات منقضی (وقتی اسلات زنده نیست)
  if (!isLive) {
    try {
      await ensureAdminFeaturedNoNextNotification(prisma, result.slotId);
    } catch (err) {
      console.warn('ensureAdminFeaturedNoNextNotification failed:', err);
    }
  }

  return result;
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
