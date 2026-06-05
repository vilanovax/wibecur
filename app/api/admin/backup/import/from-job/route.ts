import { NextResponse } from 'next/server';
import fs from 'fs';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import { parseBackupFile } from '@/lib/admin/backup/parse-archive';
import { resolveBackupFilePath } from '@/lib/admin/backup/storage';
import {
  createImportSessionId,
  saveImportSession,
} from '@/lib/admin/backup/import-storage';
import { buildImportPreview } from '@/lib/admin/backup/build-preview';

export async function POST(request: Request) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    await ensurePrismaConnection();

    const body = await request.json();
    const jobId = typeof body.jobId === 'string' ? body.jobId : '';
    if (!jobId) {
      return NextResponse.json({ error: 'شناسه job لازم است' }, { status: 400 });
    }

    const job = await prisma.backup_jobs.findUnique({ where: { id: jobId } });
    if (!job || job.status !== 'COMPLETED' || !job.fileName) {
      return NextResponse.json({ error: 'فایل پشتیبان آماده نیست' }, { status: 404 });
    }

    const filePath = job.filePath ?? resolveBackupFilePath(job.fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'فایل روی دیسک یافت نشد' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const bundle = await parseBackupFile(buffer, job.fileName);
    const sessionId = createImportSessionId();
    saveImportSession(sessionId, bundle);
    const preview = buildImportPreview(sessionId, bundle);

    return NextResponse.json({ data: preview }, { status: 201 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Backup import from job error:', err);
    return NextResponse.json(
      {
        error: 'خطا در بارگذاری از job',
        ...(process.env.NODE_ENV === 'development' ? { detail } : {}),
      },
      { status: 400 }
    );
  }
}
