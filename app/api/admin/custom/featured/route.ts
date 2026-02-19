import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { getCurrentFeaturedSlot } from '@/lib/home-featured';
import { getTrendingScoreForList } from '@/lib/trending/service';

/**
 * GET /api/admin/custom/featured
 * لیست اسلات‌ها (فعلی، بعدی، گذشته)، لیست لیست‌ها برای انتخاب، آمار هر اسلات (VIEW_LIST، QUICK_SAVE).
 */
/** برای جلوگیری از 500 به‌خاطر سریال‌نشدن Date/undefined/BigInt در JSON */
function safeJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(safeJson);
  if (value instanceof Date) return value.toISOString();
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as object)) {
    if (v === undefined) continue;
    out[k] = safeJson(v);
  }
  return out;
}

export async function GET() {
  const fail = (step: string, err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`Admin featured GET failed at [${step}]:`, message, stack ?? err);
    return NextResponse.json(
      {
        error: 'خطا در دریافت داده',
        step,
        details: message,
        ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
      },
      { status: 500 }
    );
  };

  try {
    let userOrRes: Awaited<ReturnType<typeof requirePermission>>;
    try {
      userOrRes = await requirePermission('manage_lists');
    } catch (authErr) {
      console.error('Admin featured auth error:', authErr);
      return NextResponse.json(
        { error: 'خطا در احراز هویت', details: process.env.NODE_ENV === 'development' && authErr instanceof Error ? authErr.message : undefined },
        { status: 401 }
      );
    }
    if (userOrRes instanceof NextResponse) return userOrRes;

    const now = new Date();

    // همیشه اول لیست‌ها را جداگانه می‌گیریم تا حتی با خطای اسلات/رویداد، دراپ‌داون پر شود
    let allLists: { id: string; title: string; slug: string; saveCount: number; isPublic?: boolean; isActive?: boolean; deletedAt?: Date | null; isFeatured?: boolean; categories: { name: string; slug: string } | null }[] = [];
    try {
      allLists = await prisma.lists.findMany({
        where: {},
        select: {
          id: true,
          title: true,
          slug: true,
          saveCount: true,
          isPublic: true,
          isActive: true,
          deletedAt: true,
          isFeatured: true,
          categories: { select: { name: true, slug: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { saveCount: 'desc' }],
        take: 300,
      });
    } catch (listErr) {
      console.error('Admin featured lists query error:', listErr);
    }

    let currentSlotResult: Awaited<ReturnType<typeof getCurrentFeaturedSlot>> = null;
    try {
      currentSlotResult = await getCurrentFeaturedSlot(prisma);
    } catch (e) {
      console.warn('getCurrentFeaturedSlot in admin featured failed:', e);
    }

    let upcomingSlots: { id: string; listId: string; startAt: Date; endAt: Date | null; orderIndex: number; lists: unknown }[] = [];
    let pastSlots: { id: string; listId: string; startAt: Date; endAt: Date | null; orderIndex: number; lists: unknown }[] = [];
    let eventCounts: { slotId: string; action: string; _count: { id: number } }[] = [];

    try {
      [upcomingSlots, pastSlots, eventCounts] = await Promise.all([
        prisma.home_featured_slot.findMany({
          where: { startAt: { gt: now } },
          orderBy: { startAt: 'asc' },
          include: {
            lists: {
              select: {
                id: true,
                title: true,
                slug: true,
                saveCount: true,
                categories: { select: { name: true, slug: true } },
              },
            },
          },
        }),
        prisma.home_featured_slot.findMany({
          where: { endAt: { lt: now } },
          orderBy: { endAt: 'desc' },
          take: 50,
          include: {
            lists: {
              select: {
                id: true,
                title: true,
                slug: true,
                saveCount: true,
                categories: { select: { name: true, slug: true } },
              },
            },
          },
        }),
        prisma.home_featured_event.groupBy({
          by: ['slotId', 'action'],
          _count: { id: true },
        }),
      ]);
    } catch (queryErr) {
      console.error('Admin featured slots/events query error:', queryErr);
    }

    const countMap = new Map<string, { viewList: number; quickSave: number }>();
    for (const g of eventCounts) {
      const key = g.slotId;
      if (!countMap.has(key)) countMap.set(key, { viewList: 0, quickSave: 0 });
      const c = countMap.get(key)!;
      const n = g._count?.id ?? 0;
      if (g.action === 'VIEW_LIST') c.viewList = n;
      else c.quickSave = n;
    }

    const mapSlot = (s: { id: string; listId: string; startAt: Date; endAt: Date | null; orderIndex: number; lists: unknown }) => {
      const counts = countMap.get(s.id) ?? { viewList: 0, quickSave: 0 };
      let startStr: string;
      let endStr: string | null = null;
      try {
        startStr = typeof s.startAt === 'string' ? s.startAt : (s.startAt instanceof Date ? s.startAt.toISOString() : String(s.startAt));
        endStr = s.endAt == null ? null : typeof s.endAt === 'string' ? s.endAt : (s.endAt instanceof Date ? s.endAt.toISOString() : String(s.endAt));
      } catch {
        startStr = new Date().toISOString();
      }
      return {
        id: s.id,
        listId: s.listId,
        list: s.lists ?? null,
        startAt: startStr,
        endAt: endStr,
        orderIndex: s.orderIndex,
        viewListCount: counts.viewList,
        quickSaveCount: counts.quickSave,
      };
    };

    let currentPayload: { id: string; listId: string; list: unknown; startAt: string; endAt: string | null; orderIndex: number; viewListCount: number; quickSaveCount: number } | null = null;
    try {
      currentPayload = currentSlotResult
        ? {
            id: currentSlotResult.slotId,
            listId: currentSlotResult.listId,
            list: currentSlotResult.list,
            startAt: currentSlotResult.startAt instanceof Date ? currentSlotResult.startAt.toISOString() : String(currentSlotResult.startAt),
            endAt: currentSlotResult.endAt == null ? null : (currentSlotResult.endAt instanceof Date ? currentSlotResult.endAt.toISOString() : String(currentSlotResult.endAt)),
            orderIndex: 0,
            viewListCount: countMap.get(currentSlotResult.slotId)?.viewList ?? 0,
            quickSaveCount: countMap.get(currentSlotResult.slotId)?.quickSave ?? 0,
          }
        : null;
    } catch (e) {
      console.warn('currentPayload serialize failed:', e);
    }

    let body: { current: typeof currentPayload; fallbackList: { id: string; title: string; slug: string } | null; upcoming: unknown[]; past: unknown[]; lists: unknown[] };
    try {
      const serializedLists = allLists.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        saveCount: l.saveCount,
        isPublic: l.isPublic,
        isActive: l.isActive,
        deletedAt: l.deletedAt instanceof Date ? l.deletedAt.toISOString() : l.deletedAt ?? null,
        isFeatured: l.isFeatured,
        categories: l.categories,
      }));

      // وقتی اسلات رزروی نیست، همان لیست fallbackی که در هوم استفاده می‌شود (اولین isFeatured) را برگردان تا در UI نمایش داده شود
      const fallbackList =
        currentPayload == null && allLists.length > 0
          ? (() => {
              const first = allLists.find((l) => l.isFeatured === true && l.isActive !== false);
              const list = first ?? allLists[0];
              return list ? { id: list.id, title: list.title, slug: list.slug } : null;
            })()
          : null;

      body = {
        current: currentPayload,
        fallbackList: fallbackList ?? null,
        upcoming: upcomingSlots.map(mapSlot),
        past: pastSlots.map(mapSlot),
        lists: serializedLists,
      };
    } catch (bodyErr) {
      console.error('Admin featured body build error:', bodyErr);
      return NextResponse.json(
        { error: 'خطا در ساخت پاسخ', details: process.env.NODE_ENV === 'development' && bodyErr instanceof Error ? bodyErr.message : undefined },
        { status: 500 }
      );
    }
    let payload: unknown;
    try {
      payload = safeJson(body);
      JSON.stringify(payload); // بررسی امکان سریال (دور بودن از circular ref و غیره)
    } catch (serializeErr) {
      console.error('Admin featured response serialize error:', serializeErr);
      return NextResponse.json(
        { error: 'خطا در آماده‌سازی پاسخ', details: process.env.NODE_ENV === 'development' && serializeErr instanceof Error ? serializeErr.message : undefined },
        { status: 500 }
      );
    }
    const response = NextResponse.json(payload);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (err: unknown) {
    return fail('main', err);
  }
}

/**
 * POST /api/admin/custom/featured
 * ایجاد اسلات جدید: listId، startAt، endAt (اختیاری).
 * اعتبارسنجی: فقط یک اسلات در هر بازهٔ زمانی فعال.
 */
export async function POST(request: NextRequest) {
  const postFail = (step: string, err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`Admin featured POST failed at [${step}]:`, message, stack ?? err);
    return NextResponse.json(
      {
        error: 'خطا در ایجاد اسلات',
        step,
        details: message,
        ...(process.env.NODE_ENV === 'development' && stack ? { stack } : {}),
      },
      { status: 500 }
    );
  };

  try {
    let userOrRes: Awaited<ReturnType<typeof requirePermission>>;
    try {
      userOrRes = await requirePermission('manage_lists');
    } catch (authErr) {
      console.error('Admin featured POST auth error:', authErr);
      return NextResponse.json(
        { error: 'خطا در احراز هویت', details: authErr instanceof Error ? authErr.message : String(authErr) },
        { status: 401 }
      );
    }
    if (userOrRes instanceof NextResponse) return userOrRes;

    let body: { listId?: string; startAt?: string; endAt?: string };
    try {
      body = await request.json();
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'بدنهٔ درخواست نامعتبر است', details: parseErr instanceof Error ? parseErr.message : String(parseErr) },
        { status: 400 }
      );
    }
    const { listId, startAt, endAt } = body;

    if (!listId || !startAt) {
      return NextResponse.json(
        { error: 'listId و startAt الزامی هستند' },
        { status: 400 }
      );
    }

    const start = new Date(startAt);
    const end = endAt ? new Date(endAt) : null;
    if (isNaN(start.getTime()) || (end !== null && isNaN(end.getTime()))) {
      return NextResponse.json(
        { error: 'تاریخ شروع یا پایان نامعتبر است' },
        { status: 400 }
      );
    }
    if (end !== null && end <= start) {
      return NextResponse.json(
        { error: 'تاریخ پایان باید بعد از شروع باشد' },
        { status: 400 }
      );
    }

    const list = await prisma.lists.findUnique({
      where: { id: listId },
      select: { id: true },
    });
    if (!list) {
      return NextResponse.json(
        { error: 'لیست یافت نشد' },
        { status: 404 }
      );
    }

    const farFuture = new Date('2099-12-31T23:59:59Z');
    const myEnd = end ?? farFuture;
    let overlapping: { id: string } | null;
    try {
      overlapping = await prisma.home_featured_slot.findFirst({
        where: {
          startAt: { lt: myEnd },
          OR: [{ endAt: null }, { endAt: { gt: start } }],
        },
      });
    } catch (overlapErr) {
      return postFail('overlapping_check', overlapErr);
    }

    if (overlapping) {
      return NextResponse.json(
        { error: 'این بازه با اسلات دیگر تداخل دارد. در هر زمان فقط یک اسلات می‌تواند فعال باشد.' },
        { status: 400 }
      );
    }

    let slot;
    try {
      slot = await prisma.home_featured_slot.create({
        data: {
          listId,
          startAt: start,
          endAt: end,
        },
        include: {
          lists: {
            select: {
              id: true,
              title: true,
              slug: true,
              saveCount: true,
              categories: { select: { name: true, slug: true } },
            },
          },
        },
      });
    } catch (createErr) {
      return postFail('create', createErr);
    }

    try {
      const baselineSaves = slot.lists?.saveCount ?? null;
      const baselineScore = await getTrendingScoreForList(prisma, slot.listId);
      await prisma.home_featured_slot.update({
        where: { id: slot.id },
        data: {
          baselineSaves: baselineSaves ?? undefined,
          baselineScore: Number.isFinite(baselineScore) ? baselineScore : undefined,
          peakScore: Number.isFinite(baselineScore) ? baselineScore : undefined,
        },
      });
    } catch (baselineErr) {
      console.warn('Featured slot baseline snapshot failed:', baselineErr);
    }

    const cat = slot.lists?.categories;
    const categoriesPlain =
      cat && typeof cat === 'object'
        ? { name: String((cat as { name?: unknown }).name ?? ''), slug: String((cat as { slug?: unknown }).slug ?? '') }
        : null;

    const slotList = slot.lists
      ? {
          id: slot.lists.id,
          title: slot.lists.title,
          slug: slot.lists.slug,
          saveCount: slot.lists.saveCount,
          categories: categoriesPlain,
        }
      : null;

    const slotPayload = {
      success: true,
      slot: {
        id: slot.id,
        listId: slot.listId,
        list: slotList,
        startAt: slot.startAt instanceof Date ? slot.startAt.toISOString() : String(slot.startAt),
        endAt: slot.endAt == null ? null : (slot.endAt instanceof Date ? slot.endAt.toISOString() : String(slot.endAt)),
        orderIndex: Number(slot.orderIndex),
      },
    };

    try {
      return NextResponse.json(slotPayload);
    } catch (serialErr) {
      return postFail('json_response', serialErr);
    }
  } catch (err: unknown) {
    return postFail('create_or_response', err);
  }
}
