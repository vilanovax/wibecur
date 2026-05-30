import { NextResponse } from 'next/server';
import {
  DEFAULT_PUBLIC_APP_SETTINGS,
  getPublicAppSettings,
} from '@/lib/public-app-settings';
import { shouldGracefulDbFallback } from '@/lib/db-errors';

/** GET /api/settings/public — محدودیت‌های لیست شخصی (بدون نیاز به admin) */
export async function GET() {
  try {
    const data = await getPublicAppSettings();
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (shouldGracefulDbFallback(error)) {
      console.warn('Public settings fallback:', (error as Error)?.message);
      return NextResponse.json({
        success: true,
        data: DEFAULT_PUBLIC_APP_SETTINGS,
      });
    }
    console.error('Public settings error:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}
