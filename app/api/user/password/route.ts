import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { resolveSessionUserId } from '@/lib/api-db';
import { changeUserPassword, userHasPassword } from '@/lib/user-password-server';

/** GET /api/user/password — آیا کاربر رمز دارد؟ */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const hasPassword = await userHasPassword(userId);
    return NextResponse.json({ success: true, hasPassword });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** PUT /api/user/password — تغییر رمز عبور */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await changeUserPassword(userId, {
      currentPassword: String(body?.currentPassword ?? ''),
      newPassword: String(body?.newPassword ?? ''),
      confirmPassword: String(body?.confirmPassword ?? ''),
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در تغییر رمز';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
