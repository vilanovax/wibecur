import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { draftBulkSchema } from '@/lib/comment-seed/types';
import { bulkUpdateDrafts } from '@/lib/comment-seed/campaign-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id: campaignId } = await params;
  const body = await request.json();
  const parsed = draftBulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'داده نامعتبر' },
      { status: 400 }
    );
  }

  try {
    const result = await bulkUpdateDrafts(campaignId, parsed.data.action, parsed.data.draftIds);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
