import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { listAuditLogs } from '@/lib/admin/audit-query';

export async function GET(request: NextRequest) {
  try {
    const userOrRes = await requirePermission('view_audit');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(request.url);
    const data = await listAuditLogs({
      actorQuery:
        searchParams.get('actorQuery') ?? searchParams.get('actorId') ?? undefined,
      action: searchParams.get('action') ?? undefined,
      entityType: searchParams.get('entityType') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? searchParams.get('from') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? searchParams.get('to') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') ?? '20', 10),
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('Audit list error:', err);
    return NextResponse.json({ error: 'خطا در دریافت لاگ' }, { status: 500 });
  }
}
