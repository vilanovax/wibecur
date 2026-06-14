import {
  normalizeInstagramUrl,
  normalizeMapsUrl,
  normalizePhoneNumber,
  phoneToTelHref,
} from '@/lib/cafe-metadata';
import { isLocationCategorySlug } from '@/lib/category-layout';

export type ListItemQuickActionKey = 'phone' | 'maps' | 'instagram';

export type ListItemQuickAction = {
  key: ListItemQuickActionKey;
  href: string;
  label: string;
  ariaLabel: string;
};

function resolveMapsUrl(metadata: Record<string, unknown> | null | undefined): string | undefined {
  const direct = normalizeMapsUrl(typeof metadata?.mapsUrl === 'string' ? metadata.mapsUrl : undefined);
  if (direct) return direct;

  const address = typeof metadata?.address === 'string' ? metadata.address.trim() : '';
  return address ? normalizeMapsUrl(address) : undefined;
}

/** اکشن‌های سریع کارت — فقط برای دسته‌های مکان‌محور */
export function buildListItemQuickActions(
  metadata: Record<string, unknown> | null | undefined,
  categorySlug?: string | null
): ListItemQuickAction[] {
  if (!categorySlug || !isLocationCategorySlug(categorySlug)) return [];

  const actions: ListItemQuickAction[] = [];

  const phone = normalizePhoneNumber(typeof metadata?.phone === 'string' ? metadata.phone : undefined);
  if (phone) {
    actions.push({
      key: 'phone',
      href: phoneToTelHref(phone),
      label: 'تماس',
      ariaLabel: `تماس با ${phone}`,
    });
  }

  const mapsUrl = resolveMapsUrl(metadata);
  if (mapsUrl) {
    actions.push({
      key: 'maps',
      href: mapsUrl,
      label: 'نقشه',
      ariaLabel: 'باز کردن در نقشه',
    });
  }

  const instagram = normalizeInstagramUrl(
    typeof metadata?.instagram === 'string' ? metadata.instagram : undefined
  );
  if (instagram) {
    actions.push({
      key: 'instagram',
      href: instagram,
      label: 'اینستا',
      ariaLabel: 'صفحه اینستاگرام',
    });
  }

  return actions;
}

export function itemHasMapLocation(
  metadata: Record<string, unknown> | null | undefined,
  categorySlug?: string | null
): boolean {
  if (!categorySlug || !isLocationCategorySlug(categorySlug)) return false;
  return Boolean(resolveMapsUrl(metadata));
}

/** URL نقشه برای iframe embed */
export function mapsUrlToEmbedUrl(mapsUrl: string): string {
  try {
    const parsed = new URL(mapsUrl);
    const query = parsed.searchParams.get('query');
    if (query) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
    }
  } catch {
    /* fall through */
  }

  if (mapsUrl.includes('output=embed')) return mapsUrl;
  const separator = mapsUrl.includes('?') ? '&' : '?';
  return `${mapsUrl}${separator}output=embed`;
}

export function resolveItemMapsUrl(
  metadata: Record<string, unknown> | null | undefined
): string | undefined {
  return resolveMapsUrl(metadata);
}
