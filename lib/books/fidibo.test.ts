import { describe, expect, it } from 'vitest';
import { parseFidiboListResponse, parseFidiboSearchResponse } from '@/lib/books/fidibo';

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

describe('parseFidiboListResponse', () => {
  it('parses flat result array from contents/list API', () => {
    const data = {
      data: {
        per_page: 15,
        result: [
          {
            id: 84590,
            title: 'سقوط',
            subtitle: 'آلبر کامو',
            content_type: 'audiobook',
            cover: { image: 'https://cdn.fidibo.com/cover.jpg' },
            action: { web_url: '/book/84590-کتاب-صوتی-سقوط' },
          },
        ],
      },
    };
    const candidates = parseFidiboListResponse(data);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.bookId).toBe('84590');
    expect(candidates[0]?.title).toBe('سقوط');
  });
});
