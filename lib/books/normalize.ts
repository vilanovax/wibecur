const INVISIBLE_RE = /[\u200c\u200d\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;
const SMART_QUOTES_RE = /[\u2018\u2019\u201a\u201b\u2039\u203a]/g;

/** نرمال‌سازی متن فارسی/لاتین برای مقایسه عنوان */
export function normalizeBookTitle(text: string): string {
  return text
    .normalize('NFKC')
    .replace(INVISIBLE_RE, '')
    .replace(SMART_QUOTES_RE, "'")
    .replace(/[«»""]/g, '')
    .replace(/[كک]/g, 'ک')
    .replace(/[يی]/g, 'ی')
    .replace(/[أإآٱا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** حذف پیشوندهای رایج در عنوان کتاب */
export function stripBookTitlePrefix(title: string): string {
  return title
    .replace(/^(کتاب\s+)?(صوتی\s+)?(خلاصه\s+)?(رمان\s+)?/i, '')
    .replace(/^(book|audiobook)\s+/i, '')
    .trim();
}

/** sanitize برای JSON export */
export function sanitizeBookText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(INVISIBLE_RE, '')
    .replace(SMART_QUOTES_RE, "'")
    .replace(/[«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

/** شابک یکدست — فقط رقم */
export function normalizeIsbn(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/[^\d]/g, '');
  return digits.length >= 10 ? digits : null;
}

/** عنوان کوتاه برای import — حذف پیشوند و زیرعنوان بعد از : */
export function shortBookDisplayTitle(title: string): string {
  let t = stripBookTitlePrefix(sanitizeBookText(title));
  const colonIdx = t.indexOf(':');
  if (colonIdx > 0) {
    t = stripBookTitlePrefix(t.slice(0, colonIdx).trim());
  }
  const semiIdx = t.indexOf('؛');
  if (semiIdx > 0 && semiIdx < 40) {
    t = stripBookTitlePrefix(t.slice(0, semiIdx).trim());
  }
  return t;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
