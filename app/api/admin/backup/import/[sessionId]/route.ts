import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { loadImportSession } from '@/lib/admin/backup/import-storage';
import { buildImportPreview } from '@/lib/admin/backup/build-preview';

type Params = { params: Promise<{ sessionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { sessionId } = await params;
    const bundle = loadImportSession(sessionId);
    if (!bundle) {
      return NextResponse.json({ error: 'نشست منقضی یا یافت نشد. دوباره فایل را بارگذاری کنید.' }, { status: 404 });
    }

    const preview = buildImportPreview(sessionId, bundle);
    return NextResponse.json({ data: preview }, { status: 200 });
  } catch (err) {
    console.error('Backup import preview error:', err);
    return NextResponse.json({ error: 'خطا در پیش‌نمایش' }, { status: 500 });
  }
}
