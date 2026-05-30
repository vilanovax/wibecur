import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health
 * تست اتصال دیتابیس از داخل همان سرور Next.js (برای تشخیص خطای واقعی).
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.users.count();
    return NextResponse.json({
      ok: true,
      database: 'connected',
      usersCount: userCount,
    });
  } catch (err: unknown) {
    const e = err as Error & { code?: string };
    const msg = e?.message ?? String(err);
    const code = e?.code;
    console.error('[health] Database error:', code, msg);
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        code: code ?? null,
        hint: 'اگر از سرور دور هستید، connect_timeout را در DATABASE_URL افزایش دهید؛ مثال: ?connect_timeout=20',
      },
      { status: 503 }
    );
  }
}
