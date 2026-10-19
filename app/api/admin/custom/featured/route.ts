import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { getTrendingScoreForList } from '@/lib/trending/service';
import { revalidateAdminFeaturedCache } from '@/lib/admin/admin-cache';
import { getFeaturedManagementData } from '@/lib/admin/featured-management-data';

/**
 * GET /api/admin/custom/featured
 * Lean payload: slots + weekly report + performance. Lists only with ?lists=1.
 */
export async function GET(request: NextRequest) {
  try {
    let userOrRes: Awaited<ReturnType<typeof requirePermission>>;
    try {
      userOrRes = await requirePermission('manage_lists');
    } catch (authErr) {
      console.error('Admin featured auth error:', authErr);
      return NextResponse.json(
        {
          error: 'خطا در احراز هویت',
          details:
            process.env.NODE_ENV === 'development' && authErr instanceof Error
              ? authErr.message
              : undefined,
        },
        { status: 401 }
      );
    }
    if (userOrRes instanceof NextResponse) return userOrRes;

    const includeLists =
      new URL(request.url).searchParams.get('lists') === '1';
    const data = await getFeaturedManagementData({ includeLists });

    const response = NextResponse.json(data);
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Admin featured GET failed:', message, err);
    return NextResponse.json(
      {
        error: 'خطا در دریافت داده',
        details: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/custom/featured
 * ایجاد اسلات جدید: listId، startAt، endAt (اختیاری).
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
        {
          error: 'خطا در احراز هویت',
          details: authErr instanceof Error ? authErr.message : String(authErr),
        },
        { status: 401 }
      );
    }
    if (userOrRes instanceof NextResponse) return userOrRes;

    let body: { listId?: string; startAt?: string; endAt?: string };
    try {
      body = await request.json();
    } catch (parseErr) {
      return NextResponse.json(
        {
          error: 'بدنهٔ درخواست نامعتبر است',
          details:
            parseErr instanceof Error ? parseErr.message : String(parseErr),
        },
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
      return NextResponse.json({ error: 'لیست یافت نشد' }, { status: 404 });
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
        {
          error:
            'این بازه با اسلات دیگر تداخل دارد. در هر زمان فقط یک اسلات می‌تواند فعال باشد.',
        },
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
        ? {
            name: String((cat as { name?: unknown }).name ?? ''),
            slug: String((cat as { slug?: unknown }).slug ?? ''),
          }
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
        startAt:
          slot.startAt instanceof Date
            ? slot.startAt.toISOString()
            : String(slot.startAt),
        endAt:
          slot.endAt == null
            ? null
            : slot.endAt instanceof Date
              ? slot.endAt.toISOString()
              : String(slot.endAt),
        orderIndex: Number(slot.orderIndex),
      },
    };

    revalidateAdminFeaturedCache();

    try {
      return NextResponse.json(slotPayload);
    } catch (serialErr) {
      return postFail('json_response', serialErr);
    }
  } catch (err: unknown) {
    return postFail('create_or_response', err);
  }
}
