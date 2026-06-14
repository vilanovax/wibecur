import { describe, expect, it } from 'vitest';
import { buildBreadcrumbJsonLd, uiBreadcrumbToSchema } from '@/lib/breadcrumb-schema';

describe('buildBreadcrumbJsonLd', () => {
  it('builds schema with absolute urls', () => {
    const schema = buildBreadcrumbJsonLd(
      [
        { name: 'خانه', path: '/' },
        { name: 'لیست‌ها', path: '/lists' },
        { name: 'بهترین کافه‌ها' },
      ],
      'https://example.com'
    );

    expect(schema['@type']).toBe('BreadcrumbList');
    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(3);
    expect(elements[0]?.item).toBe('https://example.com/');
    expect(elements[1]?.item).toBe('https://example.com/lists');
    expect(elements[2]?.item).toBeUndefined();
  });
});

describe('uiBreadcrumbToSchema', () => {
  it('maps label and href', () => {
    expect(
      uiBreadcrumbToSchema([
        { label: 'خانه', href: '/' },
        { label: 'لیست' },
      ])
    ).toEqual([
      { name: 'خانه', path: '/' },
      { name: 'لیست', path: undefined },
    ]);
  });
});
