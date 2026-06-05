import { NextResponse } from 'next/server';
import type { UserRole } from '@prisma/client';
import { requirePermission } from '@/lib/auth/require-permission';
import { loadImportSession, deleteImportSession } from '@/lib/admin/backup/import-storage';
import { restoreBackupTables } from '@/lib/admin/backup/restore-data';
import { logAudit } from '@/lib/audit/log';

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { sessionId } = await params;
    const bundle = loadImportSession(sessionId);
    if (!bundle) {
      return NextResponse.json({ error: 'نشست منقضی شده — فایل را دوباره بارگذاری کنید' }, { status: 404 });
    }

    const body = await request.json();
    const tables = Array.isArray(body.tables)
      ? body.tables.filter((t: unknown) => typeof t === 'string')
      : [];

    if (tables.length === 0) {
      return NextResponse.json({ error: 'حداقل یک جدول را انتخاب کنید' }, { status: 400 });
    }

    const confirm = body.confirm === true;
    if (!confirm) {
      return NextResponse.json(
        { error: 'برای بازیابی باید confirm: true ارسال شود' },
        { status: 400 }
      );
    }

    const report = await restoreBackupTables(bundle.data, tables, 'merge');

    await logAudit({
      actorId: userOrRes.id,
      actorRole: userOrRes.role as UserRole,
      action: 'backup.restore',
      entityType: 'backup_import',
      entityId: sessionId,
      after: {
        tables,
        totalUpserted: report.totalUpserted,
        totalFailed: report.totalFailed,
        fileName: bundle.fileName,
      },
    });

    return NextResponse.json({
      data: {
        message: 'بازیابی انجام شد (ادغام با داده موجود)',
        report,
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Backup restore error:', err);
    return NextResponse.json(
      {
        error: 'خطا در بازیابی',
        ...(process.env.NODE_ENV === 'development' ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
