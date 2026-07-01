import { z } from 'zod';
import { extractItemTip } from '@/lib/item-metadata-display';

export const ItemTipExportItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  listTitle: z.string().optional().nullable(),
  categoryName: z.string().optional().nullable(),
  tip: z.string().nullable().optional(),
});

export const ItemTipExportPayloadSchema = z.object({
  items: z.array(ItemTipExportItemSchema).min(1).max(2000),
});

export const ItemTipImportItemSchema = z.object({
  id: z.string().min(1),
  tip: z.string().nullable(),
});

export const ItemTipImportPayloadSchema = z.object({
  items: z.array(ItemTipImportItemSchema).min(1).max(2000),
});

export type ItemTipExportItem = z.infer<typeof ItemTipExportItemSchema>;
export type ItemTipExportPayload = z.infer<typeof ItemTipExportPayloadSchema>;
export type ItemTipImportItem = z.infer<typeof ItemTipImportItemSchema>;
export type ItemTipImportPayload = z.infer<typeof ItemTipImportPayloadSchema>;

export type ItemTipRow = {
  id: string;
  title: string;
  tip: string | null;
  listId: string;
  listTitle: string;
  categoryId: string | null;
  categoryName: string;
  catalogItemId: string | null;
};

export type ItemTipsPageData = {
  items: ItemTipRow[];
  categories: { id: string; name: string; slug: string; icon: string | null }[];
  lists: { id: string; title: string; categoryId: string | null; itemCount: number }[];
  initialCategoryId: string;
  initialListId: string;
};

export const ITEM_TIP_JSON_EXAMPLE: ItemTipExportPayload = {
  items: [
    {
      id: 'clx00000000000000000000001',
      title: 'The Bourne Supremacy - برتری بورن',
      listTitle: 'اکشن‌های بدون توقف',
      categoryName: 'فیلم و سریال',
      tip: 'اکشن و جاسوسی در اوج، با تعقیب و گریزهای پیچیده و خیره‌کننده.',
    },
  ],
};

export function resolveStoredItemTip(
  metadata: Record<string, unknown> | null | undefined,
  catalogMetadata?: Record<string, unknown> | null
): string | null {
  return extractItemTip(metadata) ?? extractItemTip(catalogMetadata);
}

export function buildItemTipExportPayload(items: ItemTipRow[]): ItemTipExportPayload {
  return {
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      listTitle: item.listTitle,
      categoryName: item.categoryName,
      tip: item.tip ?? '',
    })),
  };
}

export function buildExternalItemTipAiPrompt(items: ItemTipExportItem[]): string {
  const schemaDoc = JSON.stringify(
    {
      $schema: 'وایب — فرمت ورود tip آیتم‌ها',
      description:
        'آرایه items شامل همان id ارسالی. فقط فیلد tip را به‌روز کنید — یک جمله فارسی کوتاه (حداکثر ۲ جمله) که حس آیتم را منتقل کند، بدون emoji.',
      items: [{ id: 'همان id از ورودی', tip: 'نکتهٔ کوتاه فارسی' }],
    },
    null,
    2
  );

  const inputItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    listTitle: item.listTitle ?? null,
    categoryName: item.categoryName ?? null,
    tip: item.tip ?? '',
  }));

  return [
    'برای هر آیتم، tip فارسی بنویس: یک نکتهٔ جذاب و کوتاه دربارهٔ تجربه/حس تماشا یا مطالعه (نه خلاصهٔ داستان).',
    'خروجی فقط JSON معتبر با ساختار زیر باشد:',
    schemaDoc,
    '',
    'آیتم‌های ورودی:',
    JSON.stringify({ items: inputItems }, null, 2),
  ].join('\n');
}

export function parseItemTipImportPayload(raw: unknown): ItemTipImportPayload {
  const parsed = ItemTipImportPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message || 'فرمت JSON نامعتبر است');
  }
  return parsed.data;
}

export function tryParseItemTipImportPayload(
  raw: unknown
): { success: true; data: ItemTipImportPayload } | { success: false; error: string } {
  try {
    return { success: true, data: parseItemTipImportPayload(raw) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'فرمت JSON نامعتبر است',
    };
  }
}
