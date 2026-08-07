import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { draftRegenerateSchema } from '@/lib/comment-seed/types';
import { regenerateDraft } from '@/lib/comment-seed/campaign-service';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = draftRegenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'داده نامعتبر' },
      { status: 400 }
    );
  }

  try {
    const draft = await regenerateDraft(id, {
      ...parsed.data,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    });
    return NextResponse.json({
      success: true,
      data: {
        ...draft,
        scheduledAt: draft.scheduledAt.toISOString(),
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'خطا در بازتولید';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
