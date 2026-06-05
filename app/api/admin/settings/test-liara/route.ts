import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getDecryptedSettings } from '@/lib/settings';
import { testLiaraStorage } from '@/lib/admin/integration-tests';

export async function POST(request: NextRequest) {
  try {
    const session = await checkAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const saved = await getDecryptedSettings();

    const endpoint =
      (typeof body.liaraEndpoint === 'string' && body.liaraEndpoint.trim()) ||
      saved.liaraEndpoint ||
      '';
    const bucketName =
      (typeof body.liaraBucketName === 'string' && body.liaraBucketName.trim()) ||
      saved.liaraBucketName ||
      '';
    const accessKeyId =
      (typeof body.liaraAccessKey === 'string' && body.liaraAccessKey.trim()) ||
      saved.liaraAccessKey ||
      '';
    const secretAccessKey =
      (typeof body.liaraSecretKey === 'string' && body.liaraSecretKey.trim()) ||
      saved.liaraSecretKey ||
      '';

    const result = await testLiaraStorage({
      endpoint,
      bucketName,
      accessKeyId,
      secretAccessKey,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'اتصال Liara برقرار شد' });
  } catch (error: unknown) {
    console.error('test-liara:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'خطا' },
      { status: 500 }
    );
  }
}
