import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { prisma, ensurePrismaConnection } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  BACKUP_ASSET_MODES,
  isBackupAssetMode,
  normalizeBackupScopes,
  resolveScopes,
} from '@/lib/admin/backup/types';
import { serializeBackupJob } from '@/lib/admin/backup/serialize-job';
import { runBackupJob } from '@/lib/admin/backup/run-job';

function apiError(message: string, status: number, detail?: string) {
  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === 'development' && detail ? { detail } : {}),
    },
    { status }
  );
}

export async function GET() {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    await ensurePrismaConnection();

    if (!('backup_jobs' in prisma)) {
      return apiError(
        'کلاینت Prisma قدیمی است',
        503,
        'Run: npx prisma generate — then restart npm run dev'
      );
    }

    const jobs = await prisma.backup_jobs.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        scopes: true,
        assetMode: true,
        includeTrash: true,
        fileName: true,
        fileSizeBytes: true,
        progress: true,
        errorMessage: true,
        stats: true,
        createdAt: true,
        completedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    const data = jobs.map(serializeBackupJob);

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Backup list error:', err);
    return apiError('خطا در دریافت لیست پشتیبان', 500, detail);
  }
}

export async function POST(request: Request) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    await ensurePrismaConnection();

    if (!('backup_jobs' in prisma)) {
      return apiError(
        'کلاینت Prisma قدیمی است',
        503,
        'Run: npx prisma generate — then restart npm run dev'
      );
    }

    const body = await request.json();
    const scopesRaw = Array.isArray(body.scopes) ? body.scopes : [];
    const scopes = resolveScopes(
      normalizeBackupScopes(scopesRaw.filter((s: unknown) => typeof s === 'string') as string[])
    );

    if (scopes.length === 0) {
      return NextResponse.json({ error: 'حداقل یک بخش را انتخاب کنید' }, { status: 400 });
    }

    const assetMode =
      typeof body.assetMode === 'string' && isBackupAssetMode(body.assetMode)
        ? body.assetMode
        : 'none';

    if (!(BACKUP_ASSET_MODES as readonly string[]).includes(assetMode)) {
      return NextResponse.json({ error: 'حالت رسانه نامعتبر' }, { status: 400 });
    }

    const includeTrash = Boolean(body.includeTrash);

    const running = await prisma.backup_jobs.findFirst({
      where: { status: { in: ['PENDING', 'RUNNING'] } },
    });
    if (running) {
      return NextResponse.json(
        { error: 'یک پشتیبان‌گیری در حال اجراست. لطفاً صبر کنید.' },
        { status: 409 }
      );
    }

    const job = await prisma.backup_jobs.create({
      data: {
        createdById: userOrRes.id,
        status: 'PENDING',
        scopes,
        assetMode,
        includeTrash,
        progress: 0,
      },
    });

    const actor = { id: userOrRes.id, role: userOrRes.role as UserRole };
    void runBackupJob(job.id, actor).catch((err) => {
      console.error('[backup] background job failed:', job.id, err);
    });

    return NextResponse.json(
      {
        data: {
          id: job.id,
          status: job.status,
          message: 'پشتیبان‌گیری شروع شد',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Backup create error:', err);
    return apiError('خطا در ایجاد پشتیبان', 500, detail);
  }
}
