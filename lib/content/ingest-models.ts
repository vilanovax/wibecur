import { z } from 'zod';
import { getBulkImportCategoryKind, extractImdbIdFromUrl } from '@/lib/admin/bulk-import';
import { FACT_TYPES } from '@/lib/list-entry';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';

/** مدل ورود داده. ایجنت kind را انتخاب نمی‌کند؛ از slug دسته در دیتابیس به دست می‌آید. */
export const INGEST_KINDS = ['movie', 'book', 'cafe', 'mixed'] as const;
export type IngestKind = (typeof INGEST_KINDS)[number];

const LIST_BADGES = ['TRENDING', 'NEW', 'FEATURED'] as const;
const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'] as const;
const MIXED_ENTRY_KINDS = ['tip', 'fact', 'link', 'catalog_ref'] as const;

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
    badge: z.enum(LIST_BADGES).nullable().optional(),
    isPublic: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    commentsEnabled: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1)).max(12).optional(),
  })
  .strict();

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
        author: z.string().trim().min(1, 'نام نویسنده یا سازنده در metadata.author الزامی است'),
        genre: z.string().trim().optional(),
        isbn: z.string().trim().optional(),
        source: z.enum(['taaghche', 'fidibo', 'ketabrah']).optional(),
        sourceId: z.string().trim().optional(),
        contentType: z.enum(['ebook', 'audiobook']).optional(),
      })
      .strict(),
  })
  .strict();

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
        priceRange: z.enum(PRICE_RANGES, {
          errorMap: () => ({ message: 'بازه قیمت باید یکی از $، $$، $$$ یا $$$$ باشد' }),
        }),
        cuisine: z.string().trim().optional(),
        phone: z.string().trim().optional(),
        instagram: z.string().trim().optional(),
        website: z.string().trim().optional(),
        mapsUrl: z.string().trim().optional(),
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
    entryKind: z.enum(MIXED_ENTRY_KINDS, {
      errorMap: () => ({
        message: 'entryKind باید tip، fact، link یا catalog_ref باشد',
      }),
    }),
    metadata: z
      .object({
        factType: z.enum(FACT_TYPES).optional(),
        tags: z.array(z.string().trim().min(1)).max(8).optional(),
        duration: z.string().trim().max(40).optional(),
        sourceCategorySlug: latinSlug.optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((row, ctx) => {
    if (row.entryKind === 'link' && !row.externalUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای entryKind=link، externalUrl الزامی است',
        path: ['externalUrl'],
      });
    }
    if (row.entryKind === 'fact' && !row.metadata?.factType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای entryKind=fact، metadata.factType الزامی است',
        path: ['metadata', 'factType'],
      });
    }
    if ((row.entryKind === 'tip' || row.entryKind === 'fact') && !row.tip && !row.description) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای نکته و فکت، tip یا description الزامی است',
        path: ['tip'],
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

export type IngestDocument = {
  categorySlug: string;
  kind: IngestKind;
  list: IngestListInput;
  items: BulkImportPayloadItem[];
};

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
    entryKind: kind === 'mixed' && typeof row.entryKind === 'string' ? (row.entryKind as BulkImportPayloadItem['entryKind']) : undefined,
    metadata,
  };
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
  const items: BulkImportPayloadItem[] = [];

  parsed.data.items.forEach((item, index) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      issues.push(...zodIssues(result.error, `items.${index}`));
      return;
    }
    items.push(toPayload(kind, result.data as Record<string, unknown>));
  });

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    document: {
      categorySlug: parsed.data.categorySlug,
      kind,
      list: parsed.data.list,
      items,
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
        title: 'تلماسه: قسمت دو',
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
        metadata: { author: 'گابریل گارسیا مارکز', genre: 'رمان' },
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
          cuisine: 'کافه',
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
      {
        title: 'نور صبح و خواب',
        entryKind: 'fact',
        tip: 'نور طبیعی تا یک ساعت بعد از بیدار شدن، ساعت بدن را تنظیم می‌کند.',
        metadata: { factType: 'health' },
      },
    ],
  },
};

export function renderIngestModels() {
  return {
    file: 'content/lists/<list-slug>.json',
    rules: [
      'دسته را نسازید. categorySlug باید از قبل در دیتابیس باشد.',
      'همین فایل هم لیست را در آن دسته می‌سازد، هم آیتم‌ها را وارد می‌کند.',
      'اگر slug لیست وجود داشته باشد و دسته یکی باشد، به‌روز می‌شود و آیتم تکراری دوبله نمی‌شود.',
      'kind را در JSON ننویسید. از slug دسته تشخیص داده می‌شود.',
      'عنوان‌ها فارسی. slug لیست لاتین.',
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
        optional: ['description', 'imageUrl', 'tip', 'metadata.year', 'metadata.genre', 'metadata.director', 'metadata.actors', 'metadata.imdbRating', 'metadata.country'],
        example: INGEST_EXAMPLES.movie,
      },
      book: {
        when: 'slug دسته bookspodcast است، یا شامل book یا literature است',
        required: ['title', 'metadata.author (نویسنده یا سازندهٔ پادکست)'],
        optional: ['tip', 'imageUrl', 'externalUrl', 'metadata.genre', 'metadata.isbn', 'metadata.source', 'metadata.sourceId', 'metadata.contentType'],
        example: INGEST_EXAMPLES.book,
      },
      cafe: {
        when: 'slug دسته شامل cafe یا restaurant یا food است. نمونه: cafe',
        required: ['title', 'metadata.address', 'metadata.priceRange یکی از $ $$ $$$ $$$$'],
        optional: ['tip', 'imageUrl', 'metadata.cuisine', 'metadata.phone', 'metadata.instagram', 'metadata.website', 'metadata.mapsUrl'],
        example: INGEST_EXAMPLES.cafe,
      },
      mixed: {
        when: 'بقیهٔ دسته‌ها، از جمله podcast و lifestyle و tech',
        required: ['title', 'entryKind: tip | fact | link | catalog_ref'],
        entryKinds: {
          tip: 'tip یا description',
          fact: 'tip یا description، و metadata.factType یکی از science | health | productivity | family | general',
          link: 'externalUrl',
          catalog_ref: 'عنوان یک موجودیت واقعی، مثل یک پادکست یا محصول',
        },
        example: INGEST_EXAMPLES.mixed,
      },
    },
  };
}
