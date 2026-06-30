import { describe, expect, it } from 'vitest';
import {
  buildFidiboListRequestBody,
  parseFidiboListRequest,
  parseFidiboListResponse,
  parseFidiboSearchResponse,
} from '@/lib/books/fidibo';

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
            id: 71338,
            title: 'نیمه تاریک وجود',
            subtitle: 'دبیور براون',
            content_type: 'ebook',
            cover: { image: 'https://cdn.fidibo.com/cover.jpg' },
            action: { web_url: '/book/71338-کتاب-نیمه-تاریک-وجود' },
          },
        ],
      },
    };
    const candidates = parseFidiboListResponse(data);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.bookId).toBe('71338');
    expect(candidates[0]?.title).toBe('نیمه تاریک وجود');
  });
});

describe('parseFidiboListRequest', () => {
  it('maps lists query param to proposedListId request', () => {
    const req = parseFidiboListRequest(
      'https://fidibo.com/contents/list?lists=%5B16854%2C15475%2C15521%5D&sort=WEEK_BESTSELLER'
    );
    expect(req).toEqual({
      kind: 'listIds',
      listIds: [16854, 15475, 15521],
      sort: 'WEEK_BESTSELLER',
    });
    expect(buildFidiboListRequestBody({ proposedListId: req!.listIds }, req!.sort)).toEqual({
      order: 'WEEK_BESTSELLER',
      proposedListId: [16854, 15475, 15521],
    });
  });
});
