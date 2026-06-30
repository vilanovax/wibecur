import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';
import { runBookExtractJob } from '@/lib/admin/book-extract/run-job';

type RouteParams = { params: Promise<{ id: string }> };

/** POST /api/admin/books/extract/[id]/resume — ادامه job ناموفق (فقط mode titles) */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const { id } = await params;
    await ensurePrismaConnection();

    const job = await prisma.book_extract_jobs.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: 'job یافت نشد' }, { status: 404 });
    }
    if (job.mode !== 'titles') {
      return NextResponse.json({ error: 'resume فقط برای mode عناوین پشتیبانی می‌شود' }, { status: 400 });
    }
    if (job.status !== 'FAILED') {
      return NextResponse.json({ error: 'فقط jobهای ناموفق قابل ادامه هستند' }, { status: 400 });
    }

    const running = await prisma.book_extract_jobs.findFirst({
      where: { status: { in: ['PENDING', 'RUNNING'] }, id: { not: id } },
    });
    if (running) {
      return NextResponse.json({ error: 'یک job دیگر در حال اجراست' }, { status: 409 });
    }

    await prisma.book_extract_jobs.update({
      where: { id },
      data: { status: 'PENDING', errorMessage: null, completedAt: null },
    });

    void runBookExtractJob(id, true).catch((err) => {
      console.error('[book-extract] resume failed:', id, err);
    });

    return NextResponse.json({ data: { id, message: 'ادامه استخراج شروع شد' } });
  } catch (err) {
    console.error('[book-extract] resume error:', err);
    return NextResponse.json({ error: 'خطا در ادامه job' }, { status: 500 });
  }
}
