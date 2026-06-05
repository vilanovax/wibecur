import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getDecryptedSettings } from '@/lib/settings';
import { testGoogleCustomSearch } from '@/lib/admin/integration-tests';

export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const saved = await getDecryptedSettings();

    const apiKey =
      (typeof body.googleApiKey === 'string' && body.googleApiKey.trim()) ||
      saved.googleApiKey ||
      '';
    const searchEngineId =
      (typeof body.googleSearchEngineId === 'string' &&
        body.googleSearchEngineId.trim()) ||
      saved.googleSearchEngineId ||
      '';

    const result = await testGoogleCustomSearch(apiKey, searchEngineId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'اتصال Google Custom Search برقرار شد' });
  } catch (error: unknown) {
    console.error('test-google:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
