import { z } from 'zod';
import { isMovieLikeCategory } from '@/lib/resolve-item-image';
import type { BulkImportMatch } from '@/lib/admin/bulk-import-resolve';

/** یک ردیف خام از JSON هوش مصنوعی */
export const BulkMovieImportRawSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  order: z.number().int().optional(),
  metadata: z
    .object({
      year: z.union([z.number(), z.string()]).optional(),
      genre: z.string().optional(),
      director: z.string().optional(),
      imdbRating: z.string().optional(),
      imdbId: z.string().optional(),
      imdbID: z.string().optional(),
      tmdbId: z.union([z.number(), z.string()]).optional(),
      tmdbID: z.union([z.number(), z.string()]).optional(),
    })
    .optional()
    .nullable(),
});

export type BulkMovieImportRaw = z.infer<typeof BulkMovieImportRawSchema>;

export type BulkMovieImportRow = {
  id: string;
  selected: boolean;
  valid: boolean;
  errors: string[];
  title: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  order?: number;
  metadata: {
    year?: number;
    genre?: string;
    director?: string;
    imdbRating?: string;
    imdbId?: string;
    tmdbId?: number;
  };
  /** پس از preview — تطبیق با کاتالوگ مشترک */
  match?: BulkImportMatch;
};

export function extractImdbIdFromUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const m = url.match(/imdb\.com\/title\/(tt\d{7,8})/i);
  return m?.[1];
}

export function normalizeMovieMetadata(
  meta: BulkMovieImportRaw['metadata'],
  externalUrl?: string | null
) {
  if (!meta || typeof meta !== 'object') return {};
  const out: BulkMovieImportRow['metadata'] = {};
  if (meta.year != null && String(meta.year).trim()) {
    const y = parseInt(String(meta.year).replace(/[^\d]/g, ''), 10);
    if (!Number.isNaN(y) && y > 1880 && y < 2100) out.year = y;
  }
  if (meta.genre?.trim()) out.genre = meta.genre.trim();
  if (meta.director?.trim()) out.director = meta.director.trim();
  if (meta.imdbRating?.trim()) out.imdbRating = meta.imdbRating.trim();
  const imdb = meta.imdbId || meta.imdbID || extractImdbIdFromUrl(externalUrl);
  if (imdb?.trim()) out.imdbId = imdb.trim();
  const tmdb = meta.tmdbId ?? meta.tmdbID;
  if (tmdb != null && String(tmdb).trim()) {
    const n = parseInt(String(tmdb), 10);
    if (!Number.isNaN(n)) out.tmdbId = n;
  }
  return out;
}

export function validateBulkMovieRow(raw: BulkMovieImportRaw, index: number): BulkMovieImportRow {
  const errors: string[] = [];
  const parsed = BulkMovieImportRawSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      id: `row-${index}`,
      selected: false,
      valid: false,
      errors: parsed.error.errors.map((e) => e.message),
      title: String(raw.title ?? ''),
      description: '',
      imageUrl: '',
      externalUrl: '',
      metadata: {},
    };
  }

  const data = parsed.data;
  const title = data.title.trim();
  if (!title) errors.push('عنوان خالی است');

  let externalUrl = (data.externalUrl ?? '').trim();
  if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
    errors.push('externalUrl نامعتبر است');
    externalUrl = '';
  }

  const metadata = normalizeMovieMetadata(data.metadata, externalUrl);

  let imageUrl = (data.imageUrl ?? '').trim();
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    errors.push('imageUrl باید لینک http/https باشد');
    imageUrl = '';
  }

  return {
    id: `row-${index}-${title.slice(0, 12)}`,
    selected: errors.length === 0,
    valid: errors.length === 0,
    errors,
    title,
    description: (data.description ?? '').trim(),
    imageUrl,
    externalUrl,
    order: data.order,
    metadata,
  };
}

export function parseBulkMovieJson(text: string): {
  rows: BulkMovieImportRow[];
  parseError?: string;
} {
  const trimmed = text.trim();
  if (!trimmed) return { rows: [], parseError: 'JSON خالی است' };

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return { rows: [], parseError: 'JSON نامعتبر است' };
  }

  let items: unknown[];
  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown[] }).items)) {
    items = (data as { items: unknown[] }).items;
  } else {
    return { rows: [], parseError: 'فرمت باید آرایه یا { "items": [...] } باشد' };
  }

  if (items.length === 0) return { rows: [], parseError: 'هیچ آیتمی در JSON نیست' };

  const rows = items.map((item, i) => validateBulkMovieRow(item as BulkMovieImportRaw, i));
  return { rows };
}

export function isMovieLikeListCategory(slug: string | null | undefined): boolean {
  return isMovieLikeCategory(slug);
}

export const BULK_MOVIE_JSON_EXAMPLE = `{
  "items": [
    {
      "title": "ماتریکس",
      "description": "نئو با کشف واقعیت شبیه‌سازی‌شده وارد مبارزه‌ای می‌شود که مرز انسان و ماشین را زیر سوال می‌برد.",
      "imageUrl": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "externalUrl": "https://www.imdb.com/title/tt0133093",
      "metadata": {
        "year": 1999,
        "genre": "علمی-تخیلی",
        "director": "Wachowski Brothers",
        "imdbRating": "8.7",
        "imdbId": "tt0133093",
        "tmdbId": 603
      }
    }
  ]
}`;

export type BulkImportPayloadItem = {
  title: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
  order?: number;
  metadata?: BulkMovieImportRow['metadata'];
};
