import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getDecryptedSettings, getSettings } from '@/lib/settings';
import { resolveIntegrationSecret, testDeepSeekKey } from '@/lib/admin/integration-tests';
import { resolveDeepSeekModel } from '@/lib/deepseek-models';

export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const saved = await getDecryptedSettings();
    const rawSettings = await getSettings();
    const apiKey = resolveIntegrationSecret(body.deepseekApiKey, saved.deepseekApiKey);
    const model = resolveDeepSeekModel(
      typeof body.deepseekModel === 'string' ? body.deepseekModel : saved.deepseekModel
    );

    if (!apiKey && rawSettings.deepseekApiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'کلید ذخیره‌شده قابل خواندن نیست (ENCRYPTION_KEY تغییر کرده؟). کلید را دوباره وارد و ذخیره کنید.',
        },
        { status: 400 }
      );
    }

    const result = await testDeepSeekKey(apiKey, model);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `اتصال DeepSeek برقرار شد (مدل: ${result.model})`,
    });
  } catch (error: unknown) {
    console.error('test-deepseek:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
