import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getDecryptedSettings } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const saved = await getDecryptedSettings();
    const apiKey =
      (typeof body.tmdbApiKey === 'string' && body.tmdbApiKey.trim()) ||
      saved.tmdbApiKey ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'کلید TMDb را وارد کنید' },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(15000) }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'کلید TMDb نامعتبر است' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'اتصال TMDb برقرار شد' });
  } catch (error: unknown) {
    console.error('test-tmdb:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
