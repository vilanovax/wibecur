import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { getBackupPreviewStats } from '@/lib/admin/backup/stats';

export async function GET(request: Request) {
  try {
    const userOrRes = await requirePermission('manage_backup');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const includeTrash = searchParams.get('includeTrash') === 'true';
    const scopesParam = searchParams.get('scopes');
    const scopes = scopesParam
      ? scopesParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const data = await getBackupPreviewStats(includeTrash, scopes);

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Backup stats error:', err);
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 });
  }
}
