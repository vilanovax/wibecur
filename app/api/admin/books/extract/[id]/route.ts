import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { checkAdminAuth } from '@/lib/auth';
import { serializeBookExtractJob } from '@/lib/admin/book-extract/serialize-job';

type RouteParams = { params: Promise<{ id: string }> };

/** GET /api/admin/books/extract/[id] */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 });
    }

    const { id } = await params;
    await ensurePrismaConnection();

    const job = await prisma.book_extract_jobs.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    });

    if (!job) {
      return NextResponse.json({ error: 'job یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ data: serializeBookExtractJob(job) });
  } catch (err) {
    console.error('[book-extract] get error:', err);
    return NextResponse.json({ error: 'خطا در دریافت job' }, { status: 500 });
  }
}

/** DELETE /api/admin/books/extract/[id] */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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
    if (job.status === 'RUNNING' || job.status === 'PENDING') {
      return NextResponse.json({ error: 'job در حال اجراست' }, { status: 409 });
    }

    await prisma.book_extract_jobs.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[book-extract] delete error:', err);
    return NextResponse.json({ error: 'خطا در حذف job' }, { status: 500 });
  }
}
