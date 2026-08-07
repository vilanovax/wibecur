import { NextRequest, NextResponse } from 'next/server';
import { getClientErrorMessage } from '@/lib/api-error';
import { auth } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { isDbUnavailableError } from '@/lib/db-errors';
import { normalizeUsername, validateUsernameFormat } from '@/lib/username';

// GET /api/user/username/check?username=foo — بررسی در دسترس بودن نام کاربری
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const raw = request.nextUrl.searchParams.get('username') ?? '';
    const username = normalizeUsername(raw);

    if (!username) {
      return NextResponse.json({
        success: true,
        data: { available: true, username: '', reason: 'empty' as const },
      });
    }

    const format = validateUsernameFormat(username);
    if (!format.valid) {
      return NextResponse.json({
        success: true,
        data: { available: false, username, reason: 'invalid' as const, error: format.error },
      });
    }

    const existing = await dbQuery(() =>
      prisma.users.findUnique({
        where: { username },
        select: { id: true },
      })
    );

    if (!existing) {
      return NextResponse.json({
        success: true,
        data: { available: true, username, reason: 'free' as const },
      });
    }

    if (existing.id === session.user.id) {
      return NextResponse.json({
        success: true,
        data: { available: true, username, reason: 'own' as const },
      });
    }

    return NextResponse.json({
      success: true,
      data: { available: false, username, reason: 'taken' as const },
    });
  } catch (error: unknown) {
    const message = getClientErrorMessage(error, 'Internal server error');
    console.error('Error checking username:', message);

    if (isDbUnavailableError(error)) {
      return NextResponse.json(
        { success: false, error: 'اتصال به دیتابیس برقرار نیست' },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
