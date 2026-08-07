import { getSettings } from '@/lib/settings';
import { toAbsoluteImageUrl } from '@/lib/seo';
import { getDisplayImageUrl } from '@/lib/display-image';

/** لوگوی سایت از تنظیمات — URL مطلق برای metadata و UI */
export async function getSiteLogoUrl(): Promise<string | null> {
  const settings = await getSettings();
  const raw = settings.siteLogoUrl?.trim();
  if (!raw) return null;
  return toAbsoluteImageUrl(raw) ?? raw;
}

/** URL نمایش لوگو — با proxy/storage برای img src */
export function resolveSiteLogoDisplayUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const display = getDisplayImageUrl(raw.trim());
  return display || null;
}

export async function getSiteBrandingForLayout() {
  const settings = await getSettings();
  const logoUrl = settings.siteLogoUrl?.trim() || null;
  const logoDisplayUrl = resolveSiteLogoDisplayUrl(logoUrl);
  return { logoUrl, logoDisplayUrl };
}
