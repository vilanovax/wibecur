import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '@/lib/client-ip';
import { recordListView } from '@/lib/list-view';

export const runtime = 'nodejs';

/**
 * POST /api/lists/[id]/view
 * ثبت بازدید لیست — خارج از مسیر رندر تا صفحه بتواند static/ISR بماند.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  recordListView(id, getClientIp(request.headers));

  return NextResponse.json({ success: true });
}
