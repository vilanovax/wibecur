import { describe, expect, it } from 'vitest';
import { catalogBookToRecord, catalogBookToWibeItem } from '@/lib/books/find-existing-in-db';

describe('catalogBookToRecord', () => {
  it('maps catalog book fields to import record', () => {
    const record = catalogBookToRecord({
      id: 'cat-1',
      title: 'کار عمیق',
      description: 'توضیح کتاب',
      imageUrl: 'https://storage.example/cover.jpg',
      externalUrl: 'https://ketabrah.com/book/40821',
      metadata: {
        author: 'کال نیوپورت',
        genre: 'توسعه فردی',
        isbn: '9786226840125',
        source: 'ketabrah',
        sourceId: '40821',
      },
    });

    expect(record.title).toBe('کار عمیق');
    expect(record.authors).toEqual(['کال نیوپورت']);
    expect(record.genres).toEqual(['توسعه فردی']);
    expect(record.bookId).toBe('40821');
    expect(record.source).toBe('ketabrah');
    expect(record.bookUrl).toBe('https://ketabrah.com/book/40821');
  });
});

describe('catalogBookToWibeItem', () => {
  it('produces bulk-import compatible item', () => {
    const item = catalogBookToWibeItem({
      id: 'cat-1',
      title: 'شفای زندگی',
      description: 'کتابی درباره شفا',
      imageUrl: 'https://storage.example/cover.jpg',
      externalUrl: 'https://fidibo.com/book/123',
      metadata: {
        author: 'لوئیز هی',
        source: 'fidibo',
        sourceId: '123',
      },
    });

    expect(item.title).toBe('شفای زندگی');
    expect(item.description).toBe('کتابی درباره شفا');
    expect(item.externalUrl).toBe('https://fidibo.com/book/123');
    expect(item.metadata?.author).toBe('لوئیز هی');
    expect(item.metadata?.source).toBe('fidibo');
    expect(item.metadata?.sourceId).toBe('123');
  });
});
