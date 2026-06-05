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
      (typeof body.omdbApiKey === 'string' && body.omdbApiKey.trim()) ||
      saved.omdbApiKey ||
      '';

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'کلید OMDb را وارد کنید' },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&t=test`,
      { signal: AbortSignal.timeout(15000) }
    );
    const data = (await res.json()) as { Error?: string };

    if (data.Error === 'Invalid API key!') {
      return NextResponse.json(
        { success: false, error: 'کلید OMDb نامعتبر است' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'اتصال OMDb برقرار شد' });
  } catch (error: unknown) {
    console.error('test-omdb:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
