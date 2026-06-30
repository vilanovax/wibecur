import { describe, expect, it } from 'vitest';
import { bookRecordToWibeItem } from '@/lib/books/map-to-wibe';

describe('bookRecordToWibeItem fast mode', () => {
  it('builds import-shaped payload from search snapshot', () => {
    const item = bookRecordToWibeItem(
      {
        source: 'fidibo',
        bookId: '123',
        title: 'شازده کوچولو',
        authors: ['آنتوان دو سنت‌اگزوپری'],
        genres: [],
        description: null,
        isbn: null,
        coverUrl: 'https://cdn.fidibo.com/cover.jpg',
        bookUrl: 'https://fidibo.com/book/123',
        publisher: null,
        price: null,
        rating: null,
        scrapedAt: new Date().toISOString(),
      },
      { fastMode: true, listTitle: 'بهترین رمان‌ها' }
    );

    expect(item.title).toBe('شازده کوچولو');
    expect(item.description).toContain('برای لیست «بهترین رمان‌ها»');
    expect(item.description).toContain('شازده کوچولو');
    expect(item.metadata?.author).toBe('آنتوان دو سنت‌اگزوپری');
    expect(item.externalUrl).toContain('fidibo.com');
    expect(item.imageUrl).toContain('cover.jpg');
    expect(item.metadata?.source).toBe('fidibo');
    expect(item.metadata?.sourceId).toBe('123');
  });

  it('puts narrator in tip for audiobook fast mode', () => {
    const item = bookRecordToWibeItem(
      {
        source: 'fidibo',
        bookId: '9',
        title: 'کیمیاگر',
        authors: ['پائولو کوئیلو', 'راوی: نوید محمدزاده'],
        genres: [],
        description: null,
        isbn: null,
        coverUrl: null,
        bookUrl: 'https://fidibo.com/book/9',
        publisher: null,
        price: null,
        rating: null,
        contentType: 'audiobook',
        scrapedAt: new Date().toISOString(),
      },
      { fastMode: true }
    );

    expect(item.tip).toContain('نوید محمدزاده');
    expect(item.metadata?.author).toBe('پائولو کوئیلو');
  });
});

describe('bookRecordToWibeItem enrich mode', () => {
  it('maps full ketabrah record to import JSON shape', () => {
    const item = bookRecordToWibeItem({
      source: 'ketabrah',
      bookId: '40821',
      title: 'کار عمیق',
      authors: ['کال نیوپورت'],
      translator: 'ناهید ملکی',
      genres: ['مدیریت ذهن'],
      description:
        'کتاب کار عمیق نوشته کال نیوپورت نشان می‌دهد چگونه تکنولوژی تمرکز را از شما گرفته است.\n\nدر این اثر استراتژی‌هایی مطرح می‌شود که به بهبود خروجی کار کمک می‌کند.',
      isbn: '9786226840125',
      coverUrl: 'https://img.ketabrah.com/img/l/cover.jpg',
      bookUrl: 'https://ketabrah.com/book/40821',
      publisher: 'نشر نوین',
      price: null,
      rating: 4.4,
      scrapedAt: new Date().toISOString(),
    });

    expect(item.title).toBe('کار عمیق');
    expect(item.description).toContain('تکنولوژی');
    expect(item.tip).toContain('استراتژی');
    expect(item.metadata?.author).toBe('کال نیوپورت');
    expect(item.metadata?.genre).toBe('مدیریت ذهن');
    expect(item.metadata?.isbn).toBe('9786226840125');
    expect(item.externalUrl).toContain('ketabrah.com');
  });
});
