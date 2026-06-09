import { z } from 'zod';
import { validateMetadata } from '@/lib/schemas/item-metadata';
import { isTmdbImageUrl } from '@/lib/image-url-policy';
import { isOurStorageUrl } from '@/lib/object-storage-config';
import {
  normalizeImageUrlForStorage,
  sanitizeImportUrl,
} from '@/lib/image-url-sanitize';
import type { BulkImportMatch } from '@/lib/admin/bulk-import-resolve';
import {
  ENTRY_KINDS,
  isLightweightEntryKind,
  isMixedListCategory,
  parseEntryKind,
  type EntryKind,
} from '@/lib/list-entry';

export function extractImdbIdFromUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const m = url.match(/imdb\.com\/title\/(tt\d{7,8})/i);
  return m?.[1];
}

export type BulkImportCategoryKind = 'movie' | 'book' | 'cafe' | 'general';

const baseRawSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  order: z.number().int().optional(),
  tip: z.string().optional().nullable(),
  entryKind: z.enum(ENTRY_KINDS).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type BulkImportRaw = z.infer<typeof baseRawSchema>;

export type BulkImportRow = {
  id: string;
  selected: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
  title: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  order?: number;
  metadata: Record<string, unknown>;
  match?: BulkImportMatch;
};

export type BulkImportPayloadItem = {
  title?: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
  order?: number;
  tip?: string;
  entryKind?: EntryKind;
  metadata?: Record<string, unknown>;
};

export function extractBulkImportEntryKind(
  categorySlug: string,
  metadata: Record<string, unknown>,
  topLevel?: unknown
): EntryKind | null {
  if (!isMixedListCategory(categorySlug)) return null;
  const kind = parseEntryKind(topLevel) ?? parseEntryKind(metadata.entryKind);
  if (kind && isLightweightEntryKind(kind)) return kind;
  return null;
}

export function isBulkImportLightweightRow(
  categorySlug: string,
  row: {
    metadata?: Record<string, unknown>;
    entryKind?: unknown;
  }
): boolean {
  return extractBulkImportEntryKind(
    categorySlug,
    row.metadata ?? {},
    row.entryKind
  ) != null;
}

export function mergeItemTipIntoMetadata(
  metadata: Record<string, unknown>,
  topLevelTip?: string | null
): Record<string, unknown> {
  const out = { ...metadata };
  const fromTop = typeof topLevelTip === 'string' ? topLevelTip.trim() : '';
  const fromMeta = typeof out.tip === 'string' ? out.tip.trim() : '';
  const tip = fromTop || fromMeta;
  if (tip) out.tip = tip;
  else delete out.tip;
  return out;
}

export function getBulkImportCategoryKind(slug: string | null | undefined): BulkImportCategoryKind {
  if (!slug) return 'general';
  const s = slug.toLowerCase();
  if (s.includes('movie') || s.includes('film') || s === 'series' || s.includes('cinema')) return 'movie';
  if (s.includes('book') || s.includes('literature')) return 'book';
  if (
    s.includes('cafe') ||
    s.includes('restaurant') ||
    s.includes('food') ||
    s.includes('رستوران') ||
    s.includes('کافه')
  ) {
    return 'cafe';
  }
  return 'general';
}

/** @deprecated از lib/image-url-sanitize استفاده کنید */
export {
  sanitizeImportUrl,
  normalizeImageUrlForStorage as resolveBulkImportImageUrl,
} from '@/lib/image-url-sanitize';

/** لینک خارجی — اختیاری؛ بدون خطا در preview */
function normalizeBulkImportExternalUrl(raw: string | null | undefined): string {
  return sanitizeImportUrl(raw);
}

function collectImportImageWarnings(
  rawImageUrl: string | null | undefined,
  resolvedImageUrl: string,
  metadata: Record<string, unknown>,
  externalUrl: string
): string[] {
  const warnings: string[] = [];
  const raw = (rawImageUrl ?? '').trim();

  if (raw && sanitizeImportUrl(raw) !== raw) {
    warnings.push('لینک Markdown به URL تبدیل شد');
  }

  if (!resolvedImageUrl) {
    if (raw) warnings.push('imageUrl قابل استفاده نیست');
    return warnings;
  }

  if (!resolvedImageUrl.startsWith('http')) {
    warnings.push('imageUrl باید لینک http/https باشد');
    return warnings;
  }

  if (isOurStorageUrl(resolvedImageUrl)) {
    return warnings;
  }

  if (isTmdbImageUrl(resolvedImageUrl)) {
    const imdbId =
      (typeof metadata.imdbId === 'string' && metadata.imdbId.trim()) ||
      extractImdbIdFromUrl(externalUrl);
    if (imdbId) {
      warnings.push('تصویر TMDB — در import از OMDb poster استفاده می‌شود');
    } else {
      warnings.push('تصویر TMDB بدون imdbId — ممکن است آپلود نشود');
    }
  }

  return warnings;
}

export function getBulkImportCategoryLabel(kind: BulkImportCategoryKind): string {
  switch (kind) {
    case 'movie':
      return 'فیلم/سریال';
    case 'book':
      return 'کتاب';
    case 'cafe':
      return 'کافه/رستوران';
    default:
      return 'عمومی';
  }
}

function normalizeMovieImportMetadata(
  meta: Record<string, unknown> | null | undefined,
  externalUrl?: string | null
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta || typeof meta !== 'object') meta = {};
  if (meta.year != null && String(meta.year).trim()) {
    const y = parseInt(String(meta.year).replace(/[^\d]/g, ''), 10);
    if (!Number.isNaN(y) && y > 1880 && y < 2100) out.year = y;
  }
  if (typeof meta.genre === 'string' && meta.genre.trim()) out.genre = meta.genre.trim();
  if (typeof meta.director === 'string' && meta.director.trim()) out.director = meta.director.trim();
  if (typeof meta.country === 'string' && meta.country.trim()) out.country = meta.country.trim();
  if (meta.actors != null) {
    const actors = Array.isArray(meta.actors)
      ? meta.actors.map((a) => String(a).trim()).filter(Boolean)
      : String(meta.actors)
          .split(/[,،]/)
          .map((a) => a.trim())
          .filter(Boolean);
    if (actors.length > 0) out.actors = actors.slice(0, 2);
  }
  if (typeof meta.imdbRating === 'string' && meta.imdbRating.trim()) out.imdbRating = meta.imdbRating.trim();
  if (typeof meta.tip === 'string' && meta.tip.trim()) out.tip = meta.tip.trim();
  const imdb =
    (typeof meta.imdbId === 'string' && meta.imdbId) ||
    (typeof meta.imdbID === 'string' && meta.imdbID) ||
    extractImdbIdFromUrl(externalUrl);
  if (imdb?.trim()) out.imdbId = String(imdb).trim();
  const tmdb = meta.tmdbId ?? meta.tmdbID;
  if (tmdb != null && String(tmdb).trim()) {
    const n = parseInt(String(tmdb), 10);
    if (!Number.isNaN(n)) out.tmdbId = n;
  }
  return out;
}

function normalizeBookImportMetadata(meta: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta || typeof meta !== 'object') return out;
  if (typeof meta.author === 'string' && meta.author.trim()) out.author = meta.author.trim();
  if (typeof meta.genre === 'string' && meta.genre.trim()) out.genre = meta.genre.trim();
  if (typeof meta.tip === 'string' && meta.tip.trim()) out.tip = meta.tip.trim();
  const isbn = meta.isbn ?? meta.ISBN;
  if (isbn != null && String(isbn).trim()) out.isbn = String(isbn).trim();
  return out;
}

function normalizeCafeImportMetadata(meta: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!meta || typeof meta !== 'object') return out;
  if (typeof meta.address === 'string' && meta.address.trim()) out.address = meta.address.trim();
  if (typeof meta.priceRange === 'string' && meta.priceRange.trim()) out.priceRange = meta.priceRange.trim();
  if (typeof meta.cuisine === 'string' && meta.cuisine.trim()) out.cuisine = meta.cuisine.trim();
  if (typeof meta.tip === 'string' && meta.tip.trim()) out.tip = meta.tip.trim();
  return out;
}

export function normalizeBulkImportMetadata(
  categorySlug: string,
  meta: Record<string, unknown> | null | undefined,
  externalUrl?: string | null
): Record<string, unknown> {
  const kind = getBulkImportCategoryKind(categorySlug);
  switch (kind) {
    case 'movie':
      return normalizeMovieImportMetadata(meta, externalUrl);
    case 'book':
      return normalizeBookImportMetadata(meta);
    case 'cafe':
      return normalizeCafeImportMetadata(meta);
    default: {
      const out: Record<string, unknown> =
        meta && typeof meta === 'object' ? { ...meta } : {};
      if (typeof out.tip === 'string' && out.tip.trim()) out.tip = out.tip.trim();
      if (typeof out.entryKind === 'string') out.entryKind = out.entryKind.trim();
      if (typeof out.factType === 'string') out.factType = out.factType.trim();
      return out;
    }
  }
}

export function validateBulkImportRow(
  raw: unknown,
  index: number,
  categorySlug: string
): BulkImportRow {
  const errors: string[] = [];
  const parsed = baseRawSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      id: `row-${index}`,
      selected: false,
      valid: false,
      errors: parsed.error.errors.map((e) => e.message),
      warnings: [],
      title: String((raw as { title?: string })?.title ?? ''),
      description: '',
      imageUrl: '',
      externalUrl: '',
      metadata: {},
    };
  }

  const data = parsed.data;
  let title = (data.title ?? '').trim();
  let externalUrl = normalizeBulkImportExternalUrl(data.externalUrl);

  let metadata = normalizeBulkImportMetadata(
    categorySlug,
    mergeItemTipIntoMetadata(
      (data.metadata as Record<string, unknown>) ?? {},
      data.tip
    ),
    externalUrl
  );

  const entryKind = extractBulkImportEntryKind(categorySlug, metadata, data.entryKind);
  if (entryKind) {
    metadata = { ...metadata, entryKind };
  }

  const isLightweight = entryKind != null;

  if (!title) {
    const desc = (data.description ?? '').trim();
    if (isLightweight && desc) {
      title = desc.slice(0, 80).trim();
    } else if (!isLightweight) {
      errors.push('عنوان خالی است');
    } else {
      errors.push('عنوان یا توضیحات الزامی است');
    }
  }

  if (isLightweight && entryKind === 'link' && !externalUrl) {
    errors.push('برای entryKind=link، externalUrl الزامی است');
  }

  const metaValidation = validateMetadata(categorySlug, metadata);
  if (!metaValidation.success) {
    errors.push(metaValidation.error || 'متادیتا نامعتبر');
  }

  const imageUrl = normalizeImageUrlForStorage(data.imageUrl);
  const warnings = isLightweight
    ? []
    : collectImportImageWarnings(data.imageUrl, imageUrl, metadata, externalUrl);

  return {
    id: `row-${index}-${title.slice(0, 12)}`,
    selected: errors.length === 0,
    valid: errors.length === 0,
    errors,
    warnings,
    title,
    description: (data.description ?? '').trim(),
    imageUrl,
    externalUrl,
    order: data.order,
    metadata: metaValidation.success ? (metaValidation.data as Record<string, unknown>) ?? metadata : metadata,
  };
}

/** پاک‌سازی paste از چت/Markdown قبل از JSON.parse */
export function sanitizeBulkImportJsonText(text: string): string {
  let out = text.trim();
  if (out.startsWith('\uFEFF')) out = out.slice(1);

  const fence = out.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fence) out = fence[1].trim();

  out = out
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u2032]/g, "'");

  return out;
}

export function parseBulkImportJson(
  text: string,
  categorySlug: string
): { rows: BulkImportRow[]; parseError?: string } {
  const trimmed = sanitizeBulkImportJsonText(text);
  if (!trimmed) return { rows: [], parseError: 'JSON خالی است' };

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch (err) {
    const detail = err instanceof Error ? err.message : '';
    const hint =
      trimmed.includes('```') || trimmed.includes('“')
        ? ' — اگر از چت کپی کردید، بلوک ```json را حذف کنید و از گیومهٔ انگلیسی " استفاده کنید'
        : '';
    return {
      rows: [],
      parseError: `JSON نامعتبر است${detail ? `: ${detail}` : ''}${hint}`,
    };
  }

  let items: unknown[];
  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
    items = (data as { items: unknown[] }).items;
  } else if (
    data &&
    typeof data === 'object' &&
    typeof (data as { title?: unknown }).title === 'string' &&
    (data as { title: string }).title.trim()
  ) {
    items = [data];
  } else {
    return {
      rows: [],
      parseError: 'فرمت باید آرایه، { "items": [...] } یا یک آبجکت آیتم با فیلد title باشد',
    };
  }

  if (items.length === 0) return { rows: [], parseError: 'هیچ آیتمی در JSON نیست' };

  const rows = items.map((item, i) => validateBulkImportRow(item, i, categorySlug));
  return { rows };
}

export function formatBulkImportRowSubtitle(row: BulkImportRow, categorySlug: string): string {
  const kind = getBulkImportCategoryKind(categorySlug);
  const m = row.metadata;
  switch (kind) {
    case 'movie': {
      const parts: string[] = [];
      if (m.year) parts.push(String(m.year));
      if (m.genre) parts.push(String(m.genre));
      if (m.director) parts.push(String(m.director));
      if (m.imdbRating) parts.push(`⭐ ${m.imdbRating}`);
      return parts.join(' · ') || '—';
    }
    case 'book': {
      const parts: string[] = [];
      if (m.author) parts.push(String(m.author));
      if (m.genre) parts.push(String(m.genre));
      if (m.isbn) parts.push(`ISBN ${m.isbn}`);
      return parts.join(' · ') || '—';
    }
    case 'cafe': {
      const parts: string[] = [];
      if (m.cuisine) parts.push(String(m.cuisine));
      if (m.priceRange) parts.push(String(m.priceRange));
      if (m.address) parts.push(String(m.address).slice(0, 40));
      return parts.join(' · ') || '—';
    }
    default: {
      if (m.entryKind) {
        const parts: string[] = [String(m.entryKind)];
        if (m.factType) parts.push(String(m.factType));
        if (row.description) parts.push(row.description.slice(0, 48));
        return parts.join(' · ');
      }
      return Object.keys(m).length > 0 ? JSON.stringify(m).slice(0, 80) : row.description?.slice(0, 60) || '—';
    }
  }
}

export type BulkImportListContext = {
  title?: string;
  slug?: string;
  categoryName?: string;
};

export function getBulkImportJsonExample(
  categorySlug: string,
  list?: BulkImportListContext | null
): string {
  const kind = getBulkImportCategoryKind(categorySlug);
  const listTitle = list?.title?.trim() || 'عنوان لیست';
  const categoryName = list?.categoryName?.trim() || getBulkImportCategoryLabel(kind);

  switch (kind) {
    case 'book':
      return personalizeImportExample(BOOK_JSON_EXAMPLE, listTitle, categoryName, kind);
    case 'cafe':
      return personalizeImportExample(CAFE_JSON_EXAMPLE, listTitle, categoryName, kind);
    case 'movie':
      return personalizeImportExample(MOVIE_JSON_EXAMPLE, listTitle, categoryName, kind);
    default:
      if (categorySlug.toLowerCase().includes('lifestyle') || kind === 'general') {
        return personalizeImportExample(LIFESTYLE_JSON_EXAMPLE, listTitle, categoryName, kind);
      }
      return personalizeImportExample(GENERAL_JSON_EXAMPLE, listTitle, categoryName, kind);
  }
}

function personalizeImportExample(
  template: string,
  listTitle: string,
  categoryName: string,
  kind: BulkImportCategoryKind
): string {
  try {
    const data = JSON.parse(template) as { items?: Array<Record<string, unknown>> };
    if (!Array.isArray(data.items) || data.items.length === 0) return template;

    const first = { ...data.items[0] };
    const descPrefix =
      kind === 'movie'
        ? `پیشنهاد برای لیست «${listTitle}» (${categoryName}): `
        : kind === 'book'
          ? `برای لیست «${listTitle}»: `
          : kind === 'cafe'
            ? `مقصد لیست «${listTitle}»: `
            : `آیتم برای لیست «${listTitle}» (${categoryName}): `;

    if (typeof first.description === 'string' && first.description.trim()) {
      first.description = `${descPrefix}${first.description}`;
    } else {
      first.description = `${descPrefix}توضیح کوتاه آیتم.`;
    }

    return JSON.stringify({ ...data, items: [first, ...data.items.slice(1)] }, null, 2);
  } catch {
    return template;
  }
}

export function getBulkImportJsonHint(categorySlug: string, list?: BulkImportListContext | null): string {
  const kind = getBulkImportCategoryKind(categorySlug);
  const listPart = list?.title ? ` · لیست: «${list.title}»` : '';
  switch (kind) {
    case 'movie':
      return `فرمت: { "items": [...] } یا یک آیتم با title · tip · metadata: year, genre, director, country, actors, imdbRating, imdbId, tmdbId · imageUrl: لینک مستقیم یا پروکسی${listPart}`;
    case 'book':
      return `tip (اختیاری) · metadata: author, genre, isbn${listPart}`;
    case 'cafe':
      return `tip (اختیاری) · metadata: address (الزامی), priceRange, cuisine${listPart}`;
    default:
      return `فرمت: { "items": [...] } · entryKind: tip (سبک، بدون کاتلگ) یا بدون entryKind (کاتالوگ) · title · description · tip · metadata.tags (حداکثر ۸) · externalUrl را خالی نگذارید${listPart}`;
  }
}

export function getBulkImportFormatTitle(categorySlug: string, list?: BulkImportListContext | null): string {
  const kind = getBulkImportCategoryLabel(getBulkImportCategoryKind(categorySlug));
  if (list?.title) return `${kind} — ${list.title}`;
  return kind;
}

const MOVIE_JSON_EXAMPLE = `{
  "items": [
    {
      "title": "ماتریکس",
      "description": "نئو با کشف واقعیت شبیه‌سازی‌شده وارد مبارزه‌ای می‌شود.",
      "tip": "اگر فقط یک بار دیده‌اید، یک بار دیگر با تمرکز روی جزئیات ببینید.",
      "imageUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "externalUrl": "https://www.imdb.com/title/tt0133093",
      "metadata": {
        "year": 1999,
        "genre": "علمی-تخیلی",
        "director": "Wachowski Brothers",
        "country": "ایالات متحده",
        "actors": ["Keanu Reeves", "Laurence Fishburne"],
        "imdbRating": "8.7",
        "imdbId": "tt0133093",
        "tmdbId": 603
      }
    }
  ]
}`;

const BOOK_JSON_EXAMPLE = `{
  "items": [
    {
      "title": "شازده کوچولو",
      "description": "داستان پسرکی که از سیاره‌اش سفر می‌کند و با بزرگسالان روبرو می‌شود.",
      "tip": "بهتر است نسخهٔ ترجمهٔ احمد شاملو را بخوانید.",
      "imageUrl": "https://example.com/cover.jpg",
      "externalUrl": "https://example.com/book",
      "metadata": {
        "author": "آنتوان دو سنت‌اگزوپری",
        "genre": "رمان",
        "isbn": "9789643690012"
      }
    }
  ]
}`;

const CAFE_JSON_EXAMPLE = `{
  "items": [
    {
      "title": "کافه رستوران مولین",
      "description": "فضای دنج با منوی ایرانی-فرانسوی در مرکز شهر.",
      "tip": "برای صبحانه آخر هفته حتماً از قبل رزرو کنید.",
      "imageUrl": "https://example.com/cafe.jpg",
      "externalUrl": "https://example.com/cafe",
      "metadata": {
        "address": "تهران، خیابان ولیعصر",
        "priceRange": "$$",
        "cuisine": "ایرانی"
      }
    }
  ]
}`;

const LIFESTYLE_JSON_EXAMPLE = `{
  "items": [
    {
      "entryKind": "tip",
      "title": "ورزش کوتاه اما جدی",
      "description": "۲۰ تا ۳۰ دقیقه ورزش می‌تواند انرژی و حال روزانه را بهتر کند.",
      "tip": "برای شروع، فقط ۲۰ دقیقه کافی است؛ استمرار مهم‌تر از شدت است."
    },
    {
      "entryKind": "tip",
      "title": "نور آفتاب صبح",
      "description": "قرار گرفتن در نور طبیعی صبح به تنظیم خواب و انرژی کمک می‌کند.",
      "metadata": {
        "tags": ["دوپامین", "نور صبح", "انرژی"],
        "duration": "10-15 دقیقه"
      }
    },
    {
      "title": "پیاده‌روی تند",
      "description": "یکی از ساده‌ترین راه‌ها برای بهتر شدن حال.",
      "tip": "اگر بی‌حوصله‌ای، فقط با ۱۰ دقیقه شروع کن.",
      "imageUrl": "https://example.com/brisk-walk.jpg",
      "metadata": {
        "tags": ["پیاده‌روی", "دوپامین", "حال خوب"]
      }
    }
  ]
}`;

const GENERAL_JSON_EXAMPLE = LIFESTYLE_JSON_EXAMPLE;

/** @deprecated use getBulkImportJsonExample */
export const BULK_MOVIE_JSON_EXAMPLE = MOVIE_JSON_EXAMPLE;
