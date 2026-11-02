import { NextResponse } from 'next/server';

/**
 * ثبت‌نام با رمز بدون OTP حذف شد.
 * ثبت‌نام فقط از مسیر OTP (Credentials + resolveUserAfterOtp) انجام می‌شود.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'این مسیر دیگر فعال نیست. برای ثبت‌نام از کد تأیید پیامکی استفاده کن.',
    },
    { status: 410 }
  );
}
