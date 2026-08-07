import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  getMaintenanceModeSettings,
  updateMaintenanceModeSettings,
  type MaintenanceModeSettings,
} from '@/lib/maintenance-mode';

function validateBody(body: unknown): MaintenanceModeSettings | string {
  if (!body || typeof body !== 'object') return 'داده نامعتبر است';

  const data = body as Record<string, unknown>;

  if (typeof data.enabled !== 'boolean') return 'وضعیت فعال‌سازی نامعتبر است';
  if (typeof data.title !== 'string' || !data.title.trim()) {
    return 'عنوان صفحه الزامی است';
  }
  if (typeof data.subtitle !== 'string') return 'زیرعنوان نامعتبر است';
  if (typeof data.message !== 'string' || !data.message.trim()) {
    return 'متن پیام الزامی است';
  }
  if (typeof data.showLogo !== 'boolean') return 'تنظیم لوگو نامعتبر است';
  if (typeof data.accentColor !== 'string') return 'رنگ accent نامعتبر است';
  if (typeof data.allowAdminBrowse !== 'boolean') {
    return 'تنظیم دسترسی ادمین نامعتبر است';
  }

  return {
    enabled: data.enabled,
    title: data.title.trim(),
    subtitle: data.subtitle.trim(),
    message: data.message.trim(),
    showLogo: data.showLogo,
    accentColor: data.accentColor.trim(),
    allowAdminBrowse: data.allowAdminBrowse,
  };
}

export async function GET() {
  try {
    const user = await requirePermission('manage_settings');
    if (user instanceof NextResponse) return user;

    const data = await getMaintenanceModeSettings();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در دریافت تنظیمات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requirePermission('manage_settings');
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const parsed = validateBody(body);
    if (typeof parsed === 'string') {
      return NextResponse.json({ success: false, error: parsed }, { status: 400 });
    }

    const data = await updateMaintenanceModeSettings(parsed);
    return NextResponse.json({
      success: true,
      data,
      message: parsed.enabled
        ? 'حالت اضطراری فعال شد'
        : 'حالت اضطراری غیرفعال شد',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'خطا در ذخیره تنظیمات';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
