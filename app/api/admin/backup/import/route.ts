import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { parseBackupFile } from '@/lib/admin/backup/parse-archive';
import {
  createImportSessionId,
  saveImportSession,
} from '@/lib/admin/backup/import-storage';
import { buildImportPreview } from '@/lib/admin/backup/build-preview';

const MAX_BYTES = 80 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'فایل انتخاب نشده' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'حداکثر حجم فایل ۸۰ مگابایت' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const bundle = await parseBackupFile(buffer, file.name);
    const sessionId = createImportSessionId();
    saveImportSession(sessionId, bundle);
    const preview = buildImportPreview(sessionId, bundle);

    return NextResponse.json({ data: preview }, { status: 201 });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('Backup import error:', err);
    return NextResponse.json(
      {
        error: 'خطا در خواندن فایل پشتیبان',
        ...(process.env.NODE_ENV === 'development' ? { detail } : {}),
      },
      { status: 400 }
    );
  }
}
