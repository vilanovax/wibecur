import { z } from 'zod';

export const ListDescriptionExportItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  categoryName: z.string().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
  itemCount: z.number().int().nonnegative().optional(),
  description: z.string().nullable().optional(),
});

export const ListDescriptionExportPayloadSchema = z.object({
  lists: z.array(ListDescriptionExportItemSchema).min(1).max(500),
});

export const ListDescriptionImportItemSchema = z.object({
  id: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable(),
});

export const ListDescriptionImportPayloadSchema = z.object({
  lists: z.array(ListDescriptionImportItemSchema).min(1).max(500),
});

export type ListDescriptionExportItem = z.infer<typeof ListDescriptionExportItemSchema>;
export type ListDescriptionExportPayload = z.infer<typeof ListDescriptionExportPayloadSchema>;
export type ListDescriptionImportItem = z.infer<typeof ListDescriptionImportItemSchema>;
export type ListDescriptionImportPayload = z.infer<typeof ListDescriptionImportPayloadSchema>;

export type ListDescriptionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  itemCount: number;
  categoryId: string | null;
  categoryName: string;
  categorySlug: string | null;
  categoryIcon: string;
};

export type ListDescriptionsPageData = {
  lists: ListDescriptionRow[];
  categories: { id: string; name: string; slug: string; icon: string | null }[];
};

export const LIST_DESCRIPTION_JSON_EXAMPLE: ListDescriptionExportPayload = {
  lists: [
    {
      id: 'clx00000000000000000000001',
      slug: 'best-comedy-books',
      title: 'بهترین کتاب‌های طنز',
      categoryName: 'کتاب و پادکست',
      categorySlug: 'books',
      itemCount: 42,
      description: 'مجموعه‌ای از رمان‌های طنز خارجی برای روزهایی که دنبال خنده و سرگرمی هستید.',
    },
  ],
};

export function buildListDescriptionExportPayload(
  lists: ListDescriptionRow[]
): ListDescriptionExportPayload {
  return {
    lists: lists.map((list) => ({
      id: list.id,
      slug: list.slug,
      title: list.title,
      categoryName: list.categoryName,
      categorySlug: list.categorySlug,
      itemCount: list.itemCount,
      description: list.description ?? '',
    })),
  };
}

export function buildExternalListDescriptionAiPrompt(lists: ListDescriptionExportItem[]): string {
  const schemaDoc = JSON.stringify(
    {
      $schema: 'وایب — فرمت ورود توضیحات لیست',
      description:
        'آرایه lists شامل همان id و slug ارسالی. فقط فیلد description را به‌روز کنید؛ ۲ تا ۳ جمله فارسی، گرم و دعوت‌کننده، بدون emoji.',
      lists: [
        {
          id: 'همان id از ورودی',
          slug: 'همان slug از ورودی',
          description: 'توضیح جدید فارسی',
        },
      ],
    },
    null,
    2
  );

  const inputLists = lists.map((list) => ({
    id: list.id,
    slug: list.slug,
    title: list.title,
    categoryName: list.categoryName ?? null,
    itemCount: list.itemCount ?? 0,
    description: list.description ?? '',
  }));

  return [
    'توضیحات لیست‌های curated پلتفرم WibeCur را بازنویسی یا تکمیل کن.',
    'برای هر لیست، description را به فارسی بنویس: این لیست برای چه کسی است، چه آیتم‌هایی دارد، و چرا ارزش دیدن دارد.',
    'خروجی فقط JSON معتبر با ساختار زیر باشد:',
    schemaDoc,
    '',
    'لیست‌های ورودی:',
    JSON.stringify({ lists: inputLists }, null, 2),
  ].join('\n');
}

export function parseListDescriptionImportPayload(raw: unknown): ListDescriptionImportPayload {
  const parsed = ListDescriptionImportPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message || 'فرمت JSON نامعتبر است');
  }

  const invalid = parsed.data.lists.find((item) => !item.id?.trim() && !item.slug?.trim());
  if (invalid) {
    throw new Error('هر آیتم import باید id یا slug داشته باشد');
  }

  return parsed.data;
}

export function tryParseListDescriptionImportPayload(
  raw: unknown
): { success: true; data: ListDescriptionImportPayload } | { success: false; error: string } {
  try {
    return { success: true, data: parseListDescriptionImportPayload(raw) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'فرمت JSON نامعتبر است',
    };
  }
}
