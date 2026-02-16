import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';

/**
 * GET /api/admin/custom/featured/lists
 * فقط لیست لیست‌ها برای دراپ‌داون «مدیریت منتخب‌ها». بدون اسلات و رویداد.
 */
export async function GET() {
  try {
    const userOrRes = await requirePermission('manage_lists');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const lists = await prisma.lists.findMany({
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

    const response = NextResponse.json({
      lists: lists.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        saveCount: l.saveCount,
        isPublic: l.isPublic,
        isActive: l.isActive,
        deletedAt: l.deletedAt?.toISOString() ?? null,
        isFeatured: l.isFeatured,
        categories: l.categories,
      })),
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  } catch (err: unknown) {
    console.error('Admin featured lists GET error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست‌ها', lists: [] },
      { status: 500 }
    );
  }
}
