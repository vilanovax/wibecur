import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { countSeedTargetItems } from '@/lib/comment-seed/target-resolver';
import type { CommentSeedTargetType } from '@/lib/comment-seed/types';

export async function POST(request: NextRequest) {
  const auth = await requirePermission('moderate_comments');
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const targetType = body.targetType as CommentSeedTargetType;
  const targetIds = Array.isArray(body.targetIds) ? (body.targetIds as string[]) : [];

  if (!targetType || targetIds.length === 0) {
    return NextResponse.json({ success: false, error: 'هدف نامعتبر' }, { status: 400 });
  }

  const count = await countSeedTargetItems(targetType, targetIds);
  return NextResponse.json({ success: true, data: { itemCount: count } });
}
