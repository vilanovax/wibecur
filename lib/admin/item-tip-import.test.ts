import { describe, expect, it } from 'vitest';
import { buildItemTipExportPayload, tryParseItemTipImportPayload } from '@/lib/admin/item-tip-import';

describe('item-tip-import', () => {
  it('builds export payload', () => {
    const payload = buildItemTipExportPayload([
      {
        id: '1',
        title: 'The Bourne Supremacy - برتری بورن',
        tip: 'اکشن و جاسوسی در اوج',
        listId: 'l1',
        listTitle: 'اکشن‌های بدون توقف',
        categoryId: 'c1',
        categoryName: 'فیلم و سریال',
        catalogItemId: 'cat1',
      },
    ]);
    expect(payload.items[0]?.tip).toBe('اکشن و جاسوسی در اوج');
  });

  it('parses import payload', () => {
    const result = tryParseItemTipImportPayload({
      items: [{ id: 'abc', tip: 'نکته جدید' }],
    });
    expect(result.success).toBe(true);
  });
});
