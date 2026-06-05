import { NextResponse } from 'next/server';
import fs from 'fs';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { resolveBackupFilePath } from '@/lib/admin/backup/storage';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const job = await prisma.backup_jobs.findUnique({ where: { id } });

    if (!job || job.status !== 'COMPLETED' || !job.fileName) {
      return NextResponse.json({ error: 'فایل آماده نیست' }, { status: 404 });
    }

    const filePath = job.filePath ?? resolveBackupFilePath(job.fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'فایل روی دیسک یافت نشد' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const isZip = job.fileName.endsWith('.zip');
    const contentType = isZip ? 'application/zip' : 'application/json';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(job.fileName)}"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    console.error('Backup download error:', err);
    return NextResponse.json({ error: 'خطا در دانلود' }, { status: 500 });
  }
}
