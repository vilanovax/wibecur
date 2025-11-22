import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getDecryptedSettings, updateSettings } from '@/lib/settings';

// GET /api/admin/settings
export async function GET(request: NextRequest) {
  console.log('=== GET /api/admin/settings called ===');

  try {
    console.log('Checking admin auth...');
    const session = await checkAdminAuth();
    console.log('Session:', session ? 'authenticated' : 'null');

    if (!session) {
      console.log('No session, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Fetching decrypted settings...');
    const settings = await getDecryptedSettings();
    console.log('Settings fetched successfully:', Object.keys(settings));

    // Mask sensitive keys (show only first/last few characters)
    const maskedSettings = {
      openaiApiKey: settings.openaiApiKey
        ? maskApiKey(settings.openaiApiKey)
        : null,
      tmdbApiKey: settings.tmdbApiKey ? maskApiKey(settings.tmdbApiKey) : null,
      omdbApiKey: settings.omdbApiKey ? maskApiKey(settings.omdbApiKey) : null,
      googleApiKey: settings.googleApiKey ? maskApiKey(settings.googleApiKey) : null,
      googleSearchEngineId: settings.googleSearchEngineId,
      liaraBucketName: settings.liaraBucketName,
      liaraEndpoint: settings.liaraEndpoint,
      liaraAccessKey: settings.liaraAccessKey
        ? maskApiKey(settings.liaraAccessKey)
        : null,
      liaraSecretKey: settings.liaraSecretKey
        ? maskApiKey(settings.liaraSecretKey)
        : null,
    };

    return NextResponse.json(maskedSettings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings
export async function PUT(request: NextRequest) {
  try {
    const session = await checkAdminAuth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      openaiApiKey,
      tmdbApiKey,
      omdbApiKey,
      googleApiKey,
      googleSearchEngineId,
      liaraBucketName,
      liaraEndpoint,
      liaraAccessKey,
      liaraSecretKey,
    } = body;

    await updateSettings({
      openaiApiKey,
      tmdbApiKey,
      omdbApiKey,
      googleApiKey,
      googleSearchEngineId,
      liaraBucketName,
      liaraEndpoint,
      liaraAccessKey,
      liaraSecretKey,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    );
  }
}

/**
 * Mask API key for display (show first 4 and last 4 characters)
 */
function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '****';

  const first = key.slice(0, 4);
  const last = key.slice(-4);
  const masked = '*'.repeat(Math.min(key.length - 8, 20));

  return `${first}${masked}${last}`;
}
