import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { changeUserPassword, userHasPassword } from '@/lib/user-password-server';

export async function GET() {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasPassword = await userHasPassword(session.user.id);

    return NextResponse.json({
      success: true,
      hasPassword,
      role: session.user.role,
    });
  } catch (error: unknown) {
    console.error('GET password settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await changeUserPassword(session.user.id, {
      currentPassword: String(body?.currentPassword ?? ''),
      newPassword: String(body?.newPassword ?? ''),
      confirmPassword: String(body?.confirmPassword ?? ''),
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    console.error('PUT password settings:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
