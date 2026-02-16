import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';

/** GET: جزئیات یک مورد صف بررسی به‌همراه یادداشت‌ها */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('view_moderation');
    if (userOrRes instanceof NextResponse) return userOrRes;
    const { id } = await params;

    const case_ = await prisma.moderation_case.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true } },
        notes: {
          orderBy: { createdAt: 'asc' },
          include: {
            users: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!case_) {
      return NextResponse.json({ error: 'مورد یافت نشد' }, { status: 404 });
    }

    return NextResponse.json(case_);
  } catch (err: unknown) {
    console.error('Moderation case get error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت مورد' },
      { status: 500 }
    );
  }
}
