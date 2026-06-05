import { NextResponse } from 'next/server';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { serializeBackupJob } from '@/lib/admin/backup/serialize-job';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    await ensurePrismaConnection();
    const job = await prisma.backup_jobs.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ data: serializeBackupJob(job) });
  } catch (err) {
    console.error('Backup get error:', err);
    return NextResponse.json({ error: 'خطا' }, { status: 500 });
  }
}
