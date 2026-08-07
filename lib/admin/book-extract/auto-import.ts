import { executeBulkImportForList } from '@/lib/admin/bulk-import-execute';
import type { BookExtractImportResult } from '@/lib/books/types';
import type { WibeBookImportItem } from '@/lib/books/types';
import type { BulkImportPayloadItem } from '@/lib/admin/bulk-import';

function toBulkImportItems(items: WibeBookImportItem[]): BulkImportPayloadItem[] {
  return items.map((item) => ({
    title: item.title,
    description: item.description,
    tip: item.tip,
    imageUrl: item.imageUrl,
    externalUrl: item.externalUrl,
    metadata: item.metadata,
  }));
}

export async function autoImportBookExtractResults(
  listId: string,
  items: WibeBookImportItem[]
): Promise<BookExtractImportResult> {
  if (!items.length) {
    return {
      imported: 0,
      created: 0,
      linked: 0,
      updated: 0,
      errors: 0,
      message: 'آیتمی برای import نیست',
    };
  }

  try {
    const result = await executeBulkImportForList(listId, toBulkImportItems(items));
    const errors = result.results.filter((r) => r.status === 'error').length;
    return {
      imported: result.imported,
      created: result.created,
      linked: result.linked,
      updated: result.updated,
      errors,
      message: `${result.imported} آیتم به لیست اضافه شد`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطا در import خودکار';
    return {
      imported: 0,
      created: 0,
      linked: 0,
      updated: 0,
      errors: items.length,
      message,
    };
  }
}
