/**
 * نرمال‌سازی URL تصویر — Markdown، پروکسی، و فرمت‌های نامعتبر
 */

function unwrapProxyImageParam(inner: string | null | undefined): string | null {
  const value = inner?.trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return null;
}

function isImageProxyPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  return path.includes('image-proxy') || path.includes('liara-image') || path.includes('storage-image');
}

function legacyStorageUrlFromKey(key: string): string | null {
  const decoded = decodeURIComponent(key).replace(/^\/+/, '').trim();
  if (!decoded.startsWith('wibe/')) return null;
  return `https://storage.c2.liara.space/${decoded}`;
}

/** لینک پروکسی اپ را به URL مستقیم داخل پارامتر url (یا key) برمی‌گرداند. */
function unwrapAppImageProxy(trimmed: string): string | null {
  let parsed: URL | null = null;
  if (trimmed.startsWith('/api/liara-image?') || trimmed.startsWith('/api/storage-image?')) {
    parsed = new URL(trimmed, 'http://local');
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const candidate = new URL(trimmed);
      if (isImageProxyPath(candidate.pathname)) parsed = candidate;
    } catch {
      return null;
    }
  }
  if (!parsed) return null;

  const inner = unwrapProxyImageParam(parsed.searchParams.get('url'));
  if (inner) return inner;

  const key = parsed.searchParams.get('key');
  if (key) return legacyStorageUrlFromKey(key);
  return null;
}

export function isValidHttpImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

/** لینک Markdown / فرمت خراب */
export function isCorruptImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith('[') || t.includes('](')) return true;
  if (t.startsWith('/')) return false;
  return !isValidHttpImageUrl(t);
}

/** لینک کپی‌شده از ChatGPT / Markdown → URL خالص */
export function sanitizeImportUrl(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';

  const mdLink = trimmed.match(/^\[[^\]]*\]\(([^)]+)\)$/);
  if (mdLink?.[1]) return mdLink[1].trim();

  const angle = trimmed.match(/^<([^>]+)>$/);
  if (angle?.[1]) return angle[1].trim();

  return trimmed;
}

/** فقط پروکسی خودِ اپ (/api/liara-image و /api/storage-image). پروکسی خارجی مثل Castando دست نمی‌خورد. */
export function unwrapStoredImageProxy(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  if (!trimmed.includes('liara-image') && !trimmed.includes('storage-image')) return trimmed;
  return normalizeImageUrlForStorage(trimmed) || trimmed;
}

/** unwrap پروکسی + sanitize — برای ذخیره و آپلود */
export function normalizeImageUrlForStorage(
  raw: string | null | undefined,
  depth = 0
): string {
  const trimmed = sanitizeImportUrl(raw);
  if (!trimmed || depth > 3) return trimmed;

  const unwrapped = unwrapAppImageProxy(trimmed);
  if (unwrapped && unwrapped !== trimmed) {
    return normalizeImageUrlForStorage(unwrapped, depth + 1);
  }

  return trimmed;
}

/** @deprecated alias */
export const resolveBulkImportImageUrl = normalizeImageUrlForStorage;
