import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { dbQuery } from '@/lib/db';
import { shouldGracefulDbFallback } from '@/lib/db-errors';
import { recordInterestEvent, type InterestEventType } from '@/lib/user-interests';

/** POST /api/user/interest-events */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const type = body.type as InterestEventType;
    const categorySlug = typeof body.categorySlug === 'string' ? body.categorySlug : undefined;
    const listId = typeof body.listId === 'string' ? body.listId : undefined;
    const keywords = Array.isArray(body.keywords)
      ? body.keywords.filter((k: unknown) => typeof k === 'string')
      : undefined;

    if (type !== 'list_view' && type !== 'category_view') {
      return NextResponse.json({ success: false, error: 'Invalid event type' }, { status: 400 });
    }

    await dbQuery(() =>
      recordInterestEvent(session.user.id, { type, categorySlug, listId, keywords })
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      return NextResponse.json({ success: true });
    }
    console.error('Error recording interest event:', error);
    return NextResponse.json({ success: false, error: 'خطا در ثبت رویداد' }, { status: 500 });
  }
}
