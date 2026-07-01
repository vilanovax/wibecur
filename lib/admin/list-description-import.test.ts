import { describe, expect, it } from 'vitest';
import {
  buildListDescriptionExportPayload,
  parseListDescriptionImportPayload,
  tryParseListDescriptionImportPayload,
} from '@/lib/admin/list-description-import';

describe('list-description-import', () => {
  it('builds export payload from rows', () => {
    const payload = buildListDescriptionExportPayload([
      {
        id: '1',
        slug: 'fun-books',
        title: 'کتاب‌های طنز',
        description: 'توضیح نمونه',
        itemCount: 10,
        categoryId: 'c1',
        categoryName: 'کتاب',
        categorySlug: 'books',
        categoryIcon: '📚',
      },
    ]);
    expect(payload.lists[0]?.slug).toBe('fun-books');
    expect(payload.lists[0]?.description).toBe('توضیح نمونه');
  });

  it('parses import payload with id', () => {
    const result = parseListDescriptionImportPayload({
      lists: [{ id: 'abc', description: 'جدید' }],
    });
    expect(result.lists).toHaveLength(1);
    expect(result.lists[0]?.id).toBe('abc');
  });

  it('rejects items without id or slug', () => {
    const result = tryParseListDescriptionImportPayload({
      lists: [{ description: 'بدون شناسه' }],
    });
    expect(result.success).toBe(false);
  });
});
