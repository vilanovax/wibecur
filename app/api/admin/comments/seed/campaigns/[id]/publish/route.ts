import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { publishCampaignDrafts } from '@/lib/comment-seed/campaign-service';
import { getClientErrorMessage } from '@/lib/api-error';
import { revalidateAdminCommentsCache } from '@/lib/admin/admin-cache';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const draftIds = Array.isArray(body.draftIds) ? (body.draftIds as string[]) : undefined;
  const onlyApproved = body.onlyApproved !== false;

  try {
    const result = await publishCampaignDrafts(id, { draftIds, onlyApproved });
    revalidateAdminCommentsCache();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: getClientErrorMessage(error, 'خطا در انتشار کامنت‌ها') },
      { status: 500 }
    );
  }
}
