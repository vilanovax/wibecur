import { getSettings } from '@/lib/settings';
import { toAbsoluteImageUrl } from '@/lib/seo';

/** لوگوی سایت از تنظیمات — URL مطلق برای metadata و UI */
export async function getSiteLogoUrl(): Promise<string | null> {
  const settings = await getSettings();
  const raw = settings.siteLogoUrl?.trim();
  if (!raw) return null;
  return toAbsoluteImageUrl(raw) ?? raw;
}
