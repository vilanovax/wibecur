import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/** GET: ترتیب پیشنهادی برای دسته جدید (max order + 1) */
export async function GET() {
  try {
    await requireAdmin();

    const maxOrder = await prisma.categories.aggregate({
      where: { deletedAt: null },
      _max: { order: true },
    });

    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    return NextResponse.json({ nextOrder });
  } catch (error: unknown) {
    console.error('next-order error:', error);
    return NextResponse.json({ error: 'خطا در دریافت ترتیب' }, { status: 500 });
  }
}
