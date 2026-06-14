import { sanitizeImportUrl } from '@/lib/image-url-sanitize';

const trimOptional = (val: unknown): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const t = val.trim();
  return t || undefined;
};

/** @handle | username | URL → https URL */
export function normalizeInstagramUrl(raw: string | null | undefined): string | undefined {
  const value = trimOptional(raw);
  if (!value) return undefined;

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return sanitizeImportUrl(value) || undefined;
  }

  const handle = value.replace(/^@/, '').replace(/^instagram\.com\//i, '').split(/[/?#]/)[0]?.trim();
  if (!handle) return undefined;
  return `https://www.instagram.com/${handle}`;
}

export function normalizeWebsiteUrl(raw: string | null | undefined): string | undefined {
  const value = trimOptional(raw);
  if (!value) return undefined;

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return sanitizeImportUrl(value) || undefined;
  }

  return `https://${value.replace(/^\/\//, '')}`;
}

export function normalizeMapsUrl(raw: string | null | undefined): string | undefined {
  const value = trimOptional(raw);
  if (!value) return undefined;

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return sanitizeImportUrl(value) || undefined;
  }

  const query = encodeURIComponent(value);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function normalizePhoneNumber(raw: string | null | undefined): string | undefined {
  const value = trimOptional(raw);
  if (!value) return undefined;
  return value.replace(/\s+/g, ' ').trim();
}

export function phoneToTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : phone;
}

export function displayInstagramHandle(url: string): string {
  try {
    const parsed = new URL(url);
    const segment = parsed.pathname.replace(/\//g, '').trim();
    return segment ? `@${segment}` : url;
  } catch {
    return url.startsWith('@') ? url : `@${url.replace(/^@/, '')}`;
  }
}

export function displayWebsiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function normalizeCafeMetadataFields(
  meta: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta || typeof meta !== 'object') return out;

  const address = trimOptional(meta.address);
  if (address) out.address = address;

  const priceRange = trimOptional(meta.priceRange);
  if (priceRange) out.priceRange = priceRange;

  const cuisine = trimOptional(meta.cuisine);
  if (cuisine) out.cuisine = cuisine;

  const tip = trimOptional(meta.tip);
  if (tip) out.tip = tip;

  const phone = normalizePhoneNumber(
    typeof meta.phone === 'string' ? meta.phone : undefined
  );
  if (phone) out.phone = phone;

  const instagram = normalizeInstagramUrl(
    typeof meta.instagram === 'string' ? meta.instagram : undefined
  );
  if (instagram) out.instagram = instagram;

  const website = normalizeWebsiteUrl(typeof meta.website === 'string' ? meta.website : undefined);
  if (website) out.website = website;

  const mapsUrl = normalizeMapsUrl(typeof meta.mapsUrl === 'string' ? meta.mapsUrl : undefined);
  if (mapsUrl) out.mapsUrl = mapsUrl;

  return out;
}
