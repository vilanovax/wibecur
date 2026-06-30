import { describe, expect, it } from 'vitest';
import { parseFidiboSearchResponse } from '@/lib/books/fidibo';

describe('parseFidiboSearchResponse', () => {
  it('parses search blocks into candidates', () => {
    const data = {
      data: {
        result: [
          {
            items: [
              {
                id: 5287,
                title: '<b>کیمیاگر</b>',
                subtitle: 'پائولو کوئیلو',
                cover: { image: 'https://cdn.fidibo.com/cover.jpg' },
                action: { web_url: '/book/5287-کتاب-کیمیاگر' },
              },
            ],
          },
        ],
      },
    };

    const candidates = parseFidiboSearchResponse(data);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.title).toBe('کیمیاگر');
    expect(candidates[0]?.bookId).toBe('5287');
    expect(candidates[0]?.bookUrl).toContain('fidibo.com/book/5287');
  });

  it('parses content type from search item', () => {
    const data = {
      data: {
        result: [
          {
            items: [
              {
                id: 99,
                title: 'کتاب صوتی',
                content_type: 'audiobook',
                action: { web_url: '/book/99' },
              },
            ],
          },
        ],
      },
    };
    const candidates = parseFidiboSearchResponse(data);
    expect(candidates[0]?.contentType).toBe('audiobook');
  });
});
