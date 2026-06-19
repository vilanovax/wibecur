import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { getDecryptedSettings, updateSettings } from '@/lib/settings';
import { resolveOpenAIModel } from '@/lib/openai-models';
import { prisma } from '@/lib/prisma';
import { ensureImageInLiara } from '@/lib/object-storage';

// GET /api/admin/settings
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission('manage_settings');
    if (user instanceof NextResponse) return user;
    const settings = await getDecryptedSettings();

    // Get raw settings for non-encrypted fields
    const rawSettings = await prisma.settings.findUnique({
      where: { id: 'settings' },
    });

    // Mask sensitive keys (show only first/last few characters)
    const maskedSettings = {
      openaiApiKey: settings.openaiApiKey
        ? maskApiKey(settings.openaiApiKey)
        : null,
      openaiModel: resolveOpenAIModel(rawSettings?.openaiModel),
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
      minItemsForPublicList: rawSettings?.minItemsForPublicList ?? 5,
      maxPersonalLists: rawSettings?.maxPersonalLists ?? 3,
      personalListPublicInstructions: rawSettings?.personalListPublicInstructions ?? null,
      siteLogoUrl: rawSettings?.siteLogoUrl ?? null,
    };

    return NextResponse.json({ success: true, data: maskedSettings });
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
    const user = await requirePermission('manage_settings');
    if (user instanceof NextResponse) return user;

    const body = await request.json();
    const {
      openaiApiKey,
      openaiModel,
      tmdbApiKey,
      omdbApiKey,
      googleApiKey,
      googleSearchEngineId,
      liaraBucketName,
      liaraEndpoint,
      liaraAccessKey,
      liaraSecretKey,
      minItemsForPublicList,
      maxPersonalLists,
      personalListPublicInstructions,
      siteLogoUrl,
    } = body;

    let finalSiteLogoUrl: string | null | undefined = undefined;
    if (siteLogoUrl !== undefined) {
      if (!siteLogoUrl || typeof siteLogoUrl !== 'string' || !siteLogoUrl.trim()) {
        finalSiteLogoUrl = null;
      } else {
        finalSiteLogoUrl = await ensureImageInLiara(siteLogoUrl.trim(), 'site', {
          profile: 'siteLogo',
        });
      }
    }

    await updateSettings({
      openaiApiKey,
      openaiModel: openaiModel !== undefined ? resolveOpenAIModel(openaiModel) : undefined,
      tmdbApiKey,
      omdbApiKey,
      googleApiKey,
      googleSearchEngineId,
      liaraBucketName,
      liaraEndpoint,
      liaraAccessKey,
      liaraSecretKey,
      minItemsForPublicList,
      maxPersonalLists,
      personalListPublicInstructions,
      siteLogoUrl: finalSiteLogoUrl,
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
