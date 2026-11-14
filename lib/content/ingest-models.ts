import { z } from 'zod';
import { getBulkImportCategoryKind, extractImdbIdFromUrl } from '@/lib/admin/bulk-import';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';
import { normalizeEntryKindInput } from '@/lib/list-entry';

/** مدل ورود داده. ایجنت kind را انتخاب نمی‌کند؛ از slug دسته در دیتابیس به دست می‌آید. */
export const INGEST_KINDS = ['movie', 'book', 'cafe', 'mixed'] as const;
export type IngestKind = (typeof INGEST_KINDS)[number];

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'] as const;
/** فقط tip و catalog_ref در v1 (تصمیم محتوا ۱۴) */
const MIXED_ENTRY_KINDS = ['tip', 'catalog_ref'] as const;
const BOOK_MEDIA_TYPES = ['book', 'podcast', 'app'] as const;
const ITEM_DESCRIPTION_SOFT_MAX = 320;
const LIST_SIZE_SOFT_MIN = 8;
const LIST_SIZE_SOFT_MAX = 50;

const latinSlug = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'slug باید لاتین، با حرف کوچک و خط تیره باشد'
  );

const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z
    .string()
    .trim()
    .refine(
      (value) => value.startsWith('http://') || value.startsWith('https://'),
      'آدرس باید با http:// یا https:// شروع شود'
    )
    .optional()
);

const listSchema = z
  .object({
    title: z.string().trim().min(1, 'عنوان لیست الزامی است'),
    slug: latinSlug,
    description: z.string().trim().optional(),
    coverImage: optionalHttpUrl,
    horizontalImage: optionalHttpUrl,
    /** فقط‌خواندنی برای بات — اگر مقدار داشته باشد رد می‌شود */
    badge: z.enum(['TRENDING', 'NEW', 'FEATURED']).nullable().optional(),
    isPublic: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    commentsEnabled: z.boolean().optional(),
    itemDetailEnabled: z.boolean().optional(),
    /** بات تگ نمی‌گذارد (تصمیم ۱۶) */
    tags: z.array(z.string().trim().min(1)).max(12).optional(),
  })
  .strict()
  .superRefine((list, ctx) => {
    if (list.isFeatured === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'بات نمی‌تواند isFeatured را روشن کند',
        path: ['isFeatured'],
      });
    }
    if (list.badge != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'بات نمی‌تواند badge تنظیم کند',
        path: ['badge'],
      });
    }
    if (list.tags && list.tags.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'بات نباید tags بگذارد؛ تا قانون تگ مشخص نشده خالی بگذارید',
        path: ['tags'],
      });
    }
  });

export type IngestListInput = z.infer<typeof listSchema>;

const movieItemSchema = z
  .object({
    title: z.string().trim().min(1, 'عنوان فیلم الزامی است'),
    description: z.string().trim().optional(),
    imageUrl: optionalHttpUrl,
    externalUrl: optionalHttpUrl,
    order: z.number().int().nonnegative().optional(),
    tip: z.string().trim().max(500, 'نکته حداکثر ۵۰۰ کاراکتر').optional(),
    metadata: z
      .object({
        year: z.union([z.number().int(), z.string().trim()]).optional(),
        genre: z.string().trim().optional(),
        director: z.string().trim().optional(),
        actors: z.union([z.array(z.string().trim().min(1)).max(2), z.string().trim()]).optional(),
        imdbRating: z.string().trim().optional(),
        country: z.string().trim().optional(),
        imdbId: z.string().trim().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((row, ctx) => {
    const imdb = row.metadata?.imdbId?.trim() || extractImdbIdFromUrl(row.externalUrl);
    if (!imdb) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای فیلم، لینک IMDb در externalUrl یا metadata.imdbId الزامی است',
        path: ['externalUrl'],
      });
    }
  });

const bookItemSchema = z
  .object({
    title: z.string().trim().min(1, 'عنوان کتاب الزامی است'),
    description: z.string().trim().optional(),
    imageUrl: optionalHttpUrl,
    externalUrl: optionalHttpUrl,
    order: z.number().int().nonnegative().optional(),
    tip: z.string().trim().max(500, 'نکته حداکثر ۵۰۰ کاراکتر').optional(),
    metadata: z
      .object({
        /** book (پیش‌فرض) | podcast | app — نویسنده فقط برای کتاب اجباری است */
        mediaType: z.enum(BOOK_MEDIA_TYPES).optional(),
        author: z.string().trim().optional(),
        translator: z.string().trim().optional(),
        genre: z.string().trim().optional(),
        isbn: z.string().trim().optional(),
        source: z.enum(['taaghche', 'fidibo', 'ketabrah', 'castbox']).optional(),
        sourceId: z.string().trim().optional(),
        contentType: z.enum(['ebook', 'audiobook']).optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((row, ctx) => {
    const mediaType = row.metadata.mediaType ?? 'book';
    if (mediaType === 'book' && !row.metadata.author?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای کتاب، metadata.author الزامی است',
        path: ['metadata', 'author'],
      });
    }
  });

const cafeItemSchema = z
  .object({
    title: z.string().trim().min(1, 'نام مکان الزامی است'),
    description: z.string().trim().optional(),
    imageUrl: optionalHttpUrl,
    externalUrl: optionalHttpUrl,
    order: z.number().int().nonnegative().optional(),
    tip: z.string().trim().max(500, 'نکته حداکثر ۵۰۰ کاراکتر').optional(),
    metadata: z
      .object({
        address: z.string().trim().min(1, 'آدرس الزامی است'),
        priceRange: z
          .enum(PRICE_RANGES, {
            errorMap: () => ({ message: 'بازه قیمت باید یکی از $، $$، $$$ یا $$$$ باشد' }),
          })
          .optional(),
        /** متن آزاد؛ جداکنندهٔ | مجاز است */
        cuisine: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        instagram: z.string().trim().optional(),
        website: z.string().trim().optional(),
        mapsUrl: z.string().trim().optional(),
        region: z.string().trim().optional(),
        area: z.string().trim().optional(),
        hours: z.string().trim().optional(),
        lat: z.number().finite().optional(),
        lng: z.number().finite().optional(),
      })
      .strict(),
  })
  .strict();

const mixedItemSchema = z
  .object({
    title: z.string().trim().min(1, 'عنوان الزامی است'),
    description: z.string().trim().optional(),
    imageUrl: optionalHttpUrl,
    externalUrl: optionalHttpUrl,
    order: z.number().int().nonnegative().optional(),
    tip: z.string().trim().max(500, 'نکته حداکثر ۵۰۰ کاراکتر').optional(),
    /** tip | catalog_ref — بدون مقدار یا new = کاتالوگ جدید؛ catalog → catalog_ref */
    entryKind: z.preprocess(
      (value) => {
        const normalized = normalizeEntryKindInput(value);
        if (normalized === undefined) return undefined;
        if (normalized === 'fact' || normalized === 'link') return normalized;
        return normalized;
      },
      z
        .enum(MIXED_ENTRY_KINDS, {
          errorMap: () => ({
            message:
              'entryKind باید tip یا catalog_ref باشد (مقدار new یعنی کاتالوگ جدید بدون entryKind؛ catalog معادل catalog_ref است)',
          }),
        })
        .optional()
    ),
    catalogItemId: z.string().trim().min(1).optional(),
    metadata: z
      .object({
        tags: z.array(z.string().trim().min(1)).max(8).optional(),
        duration: z.string().trim().max(40).optional(),
        sourceCategorySlug: latinSlug.optional(),
        address: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        instagram: z.string().trim().optional(),
        website: z.string().trim().optional(),
        mapsUrl: z.string().trim().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((row, ctx) => {
    if (row.entryKind === 'tip' && !row.tip && !row.description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای tip، فیلد tip یا description الزامی است',
        path: ['tip'],
      });
    }
    if (row.entryKind === 'catalog_ref' && !row.catalogItemId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای catalog_ref، catalogItemId الزامی است',
        path: ['catalogItemId'],
      });
    }
  });

const documentSchema = z
  .object({
    categorySlug: latinSlug,
    list: listSchema,
    items: z.array(z.unknown()).max(500, 'حداکثر ۵۰۰ آیتم در هر فایل').default([]),
  })
  .strict();

export type IngestIssue = { path: string; message: string };
export type IngestWarning = { path: string; code: string; message: string };

export type IngestDocument = {
  categorySlug: string;
  kind: IngestKind;
  list: IngestListInput;
  items: BulkImportPayloadItem[];
  warnings: IngestWarning[];
};

/** قالب پیشنهادی عنوان فیلم: English - فارسی */
export function looksLikeFilmTitleFormat(title: string): boolean {
  return /\S+\s+-\s+\S+/.test(title.trim());
}

export function ingestKindForSlug(slug: string | null | undefined): IngestKind {
  const kind = getBulkImportCategoryKind(slug);
  return kind === 'general' ? 'mixed' : kind;
}

function itemSchema(kind: IngestKind) {
  switch (kind) {
    case 'movie':
      return movieItemSchema;
    case 'book':
      return bookItemSchema;
    case 'cafe':
      return cafeItemSchema;
    default:
      return mixedItemSchema;
  }
}

function zodIssues(error: z.ZodError, prefix = ''): IngestIssue[] {
  return error.issues.map((issue) => {
    const path = issue.path.map(String).join('.');
    const full = [prefix, path].filter(Boolean).join('.');
    return { path: full || '(root)', message: issue.message };
  });
}

function toPayload(kind: IngestKind, row: Record<string, unknown>): BulkImportPayloadItem {
  const metadata =
    row.metadata && typeof row.metadata === 'object'
      ? (row.metadata as Record<string, unknown>)
      : undefined;
  return {
    title: typeof row.title === 'string' ? row.title : undefined,
    description: typeof row.description === 'string' ? row.description : undefined,
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : undefined,
    externalUrl: typeof row.externalUrl === 'string' ? row.externalUrl : undefined,
    order: typeof row.order === 'number' ? row.order : undefined,
    tip: typeof row.tip === 'string' ? row.tip : undefined,
    catalogItemId: typeof row.catalogItemId === 'string' ? row.catalogItemId : undefined,
    entryKind:
      kind === 'mixed' && typeof row.entryKind === 'string'
        ? (row.entryKind as BulkImportPayloadItem['entryKind'])
        : undefined,
    metadata,
  };
}

function collectItemWarnings(
  kind: IngestKind,
  row: Record<string, unknown>,
  index: number
): IngestWarning[] {
  const warnings: IngestWarning[] = [];
  const path = `items.${index}`;
  const title = typeof row.title === 'string' ? row.title : '';
  const description = typeof row.description === 'string' ? row.description : '';

  if (description.length > ITEM_DESCRIPTION_SOFT_MAX) {
    warnings.push({
      path: `${path}.description`,
      code: 'description_will_be_truncated_publicly',
      message: `توضیح ${description.length} کاراکتر است؛ در API عمومی بعد از ${ITEM_DESCRIPTION_SOFT_MAX} با … بریده می‌شود`,
    });
  }

  if (kind === 'movie' && title && !looksLikeFilmTitleFormat(title)) {
    warnings.push({
      path: `${path}.title`,
      code: 'content_rule.film_title_format',
      message: 'عنوان فیلم بهتر است به شکل English - فارسی باشد',
    });
  }

  if (kind === 'cafe') {
    const meta =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {};
    if (!meta.priceRange) {
      warnings.push({
        path: `${path}.metadata.priceRange`,
        code: 'content_rule.cafe_price_range_missing',
        message: 'بازه قیمت (priceRange) خالی است؛ فقط هشدار است، آدرس کافی است',
      });
    }
  }

  return warnings;
}

export function parseIngestDocument(
  raw: unknown
): { ok: true; document: IngestDocument } | { ok: false; issues: IngestIssue[] } {
  const parsed = documentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: zodIssues(parsed.error) };
  }

  const kind = ingestKindForSlug(parsed.data.categorySlug);
  const schema = itemSchema(kind);
  const issues: IngestIssue[] = [];
  const warnings: IngestWarning[] = [];
  const items: BulkImportPayloadItem[] = [];

  parsed.data.items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      issues.push(...zodIssues(result.error, `items.${index}`));
      return;
    }
    const data = result.data as Record<string, unknown>;
    items.push(toPayload(kind, data));
    warnings.push(...collectItemWarnings(kind, data, index));
  });

  if (issues.length > 0) return { ok: false, issues };

  const count = items.length;
  if (count > 0 && count < LIST_SIZE_SOFT_MIN) {
    warnings.push({
      path: 'items',
      code: 'content_rule.list_size',
      message: `لیست ${count} آیتم دارد؛ حداقل پیشنهادی ${LIST_SIZE_SOFT_MIN} است`,
    });
  } else if (count > LIST_SIZE_SOFT_MAX) {
    warnings.push({
      path: 'items',
      code: 'content_rule.list_size',
      message: `لیست ${count} آیتم دارد؛ حداکثر پیشنهادی ${LIST_SIZE_SOFT_MAX} است`,
    });
  }

  return {
    ok: true,
    document: {
      categorySlug: parsed.data.categorySlug,
      kind,
      list: parsed.data.list,
      items,
      warnings,
    },
  };
}

export const INGEST_EXAMPLES: Record<IngestKind, unknown> = {
  movie: {
    categorySlug: 'movies',
    list: {
      title: 'بهترین فیلم‌های اکشن ۱۴۰۳',
      slug: 'best-action-1403',
      description: 'فیلم‌های اکشنی که ارزش یک شب را دارند.',
    },
    items: [
      {
        title: 'Dune: Part Two - تلماسه: قسمت دو',
        externalUrl: 'https://www.imdb.com/title/tt15239678',
        tip: 'اگر فقط یک فیلم اکشن امسال می‌بینید، همین.',
        metadata: { year: 2024, genre: 'اکشن', director: 'Denis Villeneuve' },
      },
    ],
  },
  book: {
    categorySlug: 'bookspodcast',
    list: {
      title: 'رمان‌هایی برای شروع',
      slug: 'novels-to-start',
    },
    items: [
      {
        title: 'صد سال تنهایی',
        tip: 'آرام شروع کنید؛ خانواده را گم نکنید.',
        metadata: {
          mediaType: 'book',
          author: 'گابریل گارسیا مارکز',
          translator: 'بهمن فرزانه',
          genre: 'رمان',
        },
      },
    ],
  },
  cafe: {
    categorySlug: 'cafe',
    list: {
      title: 'کافه‌های خلوت برای کار',
      slug: 'quiet-cafes-for-work',
    },
    items: [
      {
        title: 'کافه نمونه',
        tip: 'طبقهٔ بالا ساکت‌تر است.',
        metadata: {
          address: 'تهران، خیابان انقلاب',
          priceRange: '$$',
          cuisine: 'کافه | فضای کار',
        },
      },
    ],
  },
  mixed: {
    categorySlug: 'lifestyle',
    list: {
      title: 'عادت‌های کوچک صبح',
      slug: 'small-morning-habits',
    },
    items: [
      {
        title: 'ده دقیقه بدون موبایل',
        entryKind: 'tip',
        tip: 'قبل از چک کردن پیام‌ها، آب بنوشید.',
      },
    ],
  },
};

export function renderIngestModels() {
  return {
    file: 'content/lists/<list-slug>.json',
    decisions: 'docs/ingest-api-decisions.md',
    rules: [
      'دسته را نسازید. categorySlug باید از قبل در دیتابیس باشد.',
      'همین فایل هم لیست را در آن دسته می‌سازد، هم آیتم‌ها را وارد می‌کند.',
      'اگر slug لیست وجود داشته باشد و دسته یکی باشد، به‌روز می‌شود و آیتم تکراری دوبله نمی‌شود.',
      'kind را در JSON ننویسید. از slug دسته تشخیص داده می‌شود.',
      'عنوان‌ها فارسی (فیلم: English - فارسی). slug لیست لاتین.',
      'بات isFeatured، badge و tags را تنظیم نمی‌کند.',
      'حذف و merge و catalog_and_all خارج از API بات است.',
      'لینک بین‌دسته‌ای با catalog_ref + catalogItemId مجاز است.',
    ],
    commands: {
      models: 'npm run content:models',
      categories: 'npm run content:categories',
      dryRun: 'npm run content:ingest -- --file content/lists/<slug>.json --dry-run',
      write: 'npm run content:ingest -- --file content/lists/<slug>.json',
    },
    http: {
      auth: 'Authorization: Bearer <INGEST_TOKEN>',
      categories: { method: 'GET', path: '/api/ingest/categories' },
      models: { method: 'GET', path: '/api/ingest/models' },
      lists: {
        method: 'POST',
        path: '/api/ingest/lists',
        body: 'همان JSON مدل، به‌اضافهٔ dryRun. true فقط پیش‌نمایش است و false می‌نویسد.',
      },
    },
    kinds: {
      movie: {
        when: 'slug دسته movies است، یا شامل movie، film یا cinema است',
        required: ['title', 'externalUrl صفحهٔ IMDb یا metadata.imdbId'],
        optional: [
          'description',
          'imageUrl',
          'tip',
          'metadata.year',
          'metadata.genre',
          'metadata.director',
          'metadata.actors',
          'metadata.imdbRating',
          'metadata.country',
          'metadata.imdbId',
        ],
        warnings: [
          'عنوان بدون قالب English - فارسی',
          `توضیح بیشتر از ${ITEM_DESCRIPTION_SOFT_MAX} کاراکتر`,
        ],
        example: INGEST_EXAMPLES.movie,
      },
      book: {
        when: 'slug دسته bookspodcast است، یا شامل book یا literature است',
        required: ['title', 'metadata.author فقط وقتی mediaType=book یا خالی است'],
        optional: [
          'tip',
          'imageUrl',
          'externalUrl',
          'metadata.mediaType: book|podcast|app',
          'metadata.translator',
          'metadata.genre',
          'metadata.isbn',
          'metadata.source',
          'metadata.sourceId',
          'metadata.contentType',
        ],
        example: INGEST_EXAMPLES.book,
      },
      cafe: {
        when: 'slug دسته شامل cafe یا restaurant یا food است. نمونه: cafe',
        required: ['title', 'metadata.address'],
        optional: [
          'tip',
          'imageUrl',
          'metadata.priceRange ($–$$$$؛ نبودنش فقط هشدار)',
          'metadata.cuisine (متن آزاد، | مجاز)',
          'metadata.phone',
          'metadata.instagram',
          'metadata.website',
          'metadata.mapsUrl',
          'metadata.region',
          'metadata.area',
          'metadata.hours',
          'metadata.lat',
          'metadata.lng',
        ],
        example: INGEST_EXAMPLES.cafe,
      },
      mixed: {
        when: 'بقیهٔ دسته‌ها، از جمله lifestyle و kids-and-teens',
        required: ['title'],
        optional: [
          'entryKind: tip | catalog_ref (بدون entryKind یا مقدار new = کاتالوگ جدید؛ catalog ≡ catalog_ref)',
          'catalogItemId (اجباری برای catalog_ref)',
          'description',
          'imageUrl',
          'tip',
          'metadata.website',
          'metadata.mapsUrl',
          'metadata.address',
          'metadata.tags',
        ],
        entryKinds: {
          tip: 'tip یا description — ورودی سبک بدون کاتالوگ',
          catalog_ref: 'لینک به کاتالوگ موجود با catalogItemId (حتی از دستهٔ دیگر)',
          '(بدون entryKind / new)': 'کاتالوگ جدید — برای مکان‌ها imageUrl و mapsUrl/website را بگذارید',
        },
        example: INGEST_EXAMPLES.mixed,
      },
    },
  };
}
