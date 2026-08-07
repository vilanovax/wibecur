import { describe, expect, it } from 'vitest';
import {
  buildFidiboListRequestBody,
  parseFidiboBookHtml,
  parseFidiboCategoryListMeta,
  parseFidiboListRequest,
  parseFidiboListResponse,
  parseFidiboSearchResponse,
  parseFidiboSortFromUrl,
} from '@/lib/books/fidibo';
import { bookRecordToWibeItem } from '@/lib/books/map-to-wibe';

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

describe('parseFidiboBookHtml', () => {
  it('extracts full introduction and metadata from bookContext content blocks', () => {
    const html = `<script>window.bookContext = ${JSON.stringify({
      '187095-test': {
        id: 187095,
        title: 'دروغ‌هایی که به خودمان می‌گوییم',
        subtitle: 'چگونه با حقیقت روبه‌رو شویم، خودمان را بپذیریم و زندگی بهتری بیافرینیم',
        content_type: 'ebook',
        format: 'epub',
        authors: [{ full_name: 'جان فردریکسون' }],
        publishers: [{ name: 'کتاب ارجمند' }],
        cover: {
          image:
            'https://cdn.fidibo.com/phoenixpub/content/cb8adf85-70b6-49bb-999a-6cb2c8eb0606/cover.jpg',
        },
        action: { web_url: '/book/187095-دروغ-هایی-که-به-خودمان-می-گوییم' },
        content: {
          list: [
            {
              component: 'BOOK_INTRODUCTION',
              items: [
                {
                  introduction: {
                    description:
                      '<p>جان فردریکسون در این کتاب به بررسی دروغ‌های رایجی می‌پردازد که ما برای محافظت از خود به آن‌ها پناه می‌بریم.</p><p>رو‌به‌رو شدن با حقیقت می‌تواند به رشد و شادی واقعی منجر شود.</p>',
                    short_description:
                      'با حقیقت روبه‌رو شوید و دروغ‌های درونی را بشناسید.',
                  },
                  categories: [{ name: 'روانشناسی و خودیاری' }],
                },
              ],
            },
          ],
        },
      },
    })};</script>`;

    const record = parseFidiboBookHtml(html, '187095');
    expect(record).not.toBeNull();
    expect(record?.description).toContain('جان فردریکسون');
    expect(record?.description).toContain('روبهرو شدن با حقیقت');
    expect(record?.excerpt).toContain('با حقیقت روبهرو شوید');
    expect(record?.genres).toContain('روانشناسی و خودیاری');
    expect(record?.publisher).toBe('کتاب ارجمند');
    expect(record?.contentType).toBe('ebook');

    const item = bookRecordToWibeItem(record!);
    expect(item.description).toContain('جان فردریکسون');
    expect(item.tip).toBeUndefined();
    expect(item.metadata?.author).toBe('جان فردریکسون');
    expect(item.metadata?.genre).toBe('روانشناسی و خودیاری');
    expect(item.metadata?.source).toBe('fidibo');
    expect(item.metadata?.sourceId).toBe('187095');
    expect(item.externalUrl).toContain('fidibo.com/book/187095');
  });
});

describe('parseFidiboCategoryListMeta', () => {
  const categoryHtml = `<script>window.categoryContext = ${JSON.stringify({
    'ebooksstory-foreign-comedy': {
      uuid: '8dcc65b1-fd76-49ea-b4e9-41d957c5073e',
      title: 'طنز',
      slug: 'comedy',
      long_slug: 'story-foreign-comedy',
      action: {
        type: 'content_list',
        inputs: [{ key: 'categoryId', value: '450' }],
        method: 'POST',
        url: '/flex/list/book',
        web_url: '/ebooks/story-foreign-comedy',
      },
    },
  })};</script>`;

  it('reads categoryId from action.inputs and sort from URL', () => {
    const url = 'https://fidibo.com/ebooks/story-foreign-comedy?sort=BESTSELLER';
    expect(parseFidiboSortFromUrl(url)).toBe('BESTSELLER');
    expect(parseFidiboCategoryListMeta(categoryHtml, url)).toEqual({
      categoryId: 450,
      sort: 'BESTSELLER',
    });
  });

  it('falls back to regex when categoryContext key is missing', () => {
    const html =
      '<script>"key":"categoryId","value":"450","method":"POST","url":"/flex/list/book"</script>';
    expect(
      parseFidiboCategoryListMeta(
        html,
        'https://fidibo.com/ebooks/story-foreign-comedy'
      )
    ).toEqual({
      categoryId: 450,
      sort: 'BESTSELLER',
    });
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
