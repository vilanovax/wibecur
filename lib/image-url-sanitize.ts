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
  return path.includes('image-proxy') || path.includes('liara-image');
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

/** unwrap پروکسی + sanitize — برای ذخیره و آپلود */
export function normalizeImageUrlForStorage(raw: string | null | undefined): string {
  const trimmed = sanitizeImportUrl(raw);
  if (!trimmed) return '';

  if (trimmed.startsWith('/api/liara-image?')) {
    try {
      const parsed = new URL(trimmed, 'http://local');
      const inner = unwrapProxyImageParam(parsed.searchParams.get('url'));
      if (inner) return inner;
    } catch {
      /* نگه‌داشتن مقدار خام */
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (isImageProxyPath(parsed.pathname)) {
        const inner = unwrapProxyImageParam(parsed.searchParams.get('url'));
        if (inner) return inner;
      }
    } catch {
      /* نگه‌داشتن مقدار خام */
    }
  }

  return trimmed;
}

/** @deprecated alias */
export const resolveBulkImportImageUrl = normalizeImageUrlForStorage;
