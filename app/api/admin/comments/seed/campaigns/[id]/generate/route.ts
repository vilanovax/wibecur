import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { runCampaignGeneration } from '@/lib/comment-seed/campaign-service';
import { getClientErrorMessage } from '@/lib/api-error';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const result = await runCampaignGeneration(id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در تولید کامنت‌ها') },
      { status: 500 }
    );
  }
}
