import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { getAuditLogById } from '@/lib/admin/audit-query';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requirePermission('view_audit');
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    const row = await getAuditLogById(id);
    if (!row) {
      return NextResponse.json({ error: 'رویداد یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ row });
  } catch (err) {
    console.error('Audit detail error:', err);
    return NextResponse.json({ error: 'خطا در دریافت جزئیات' }, { status: 500 });
  }
}
