import { describe, expect, it } from 'vitest';
import { getCafeTopicBySlug } from '@/lib/category-discovery/cafe-catalog';
import {
  extractItemDiscoveryFields,
  itemMatchesTopic,
  listTopicMatchLevel,
} from '@/lib/category-discovery/match';

const outdoor = getCafeTopicBySlug('outdoor')!;
const sokhari = getCafeTopicBySlug('sokhari')!;
const breakfast = getCafeTopicBySlug('breakfast')!;

describe('itemMatchesTopic', () => {
  it('matches cuisine field for سوخاری', () => {
    const fields = extractItemDiscoveryFields('رستوران فلان', {
      cuisine: 'سوخاری | برگر',
    });
    expect(itemMatchesTopic(fields, sokhari)).toBe(true);
  });

  it('matches outdoor aliases in tip', () => {
    const fields = extractItemDiscoveryFields('کافه باغ', {
      tip: 'فضای باز و حیاط‌دار',
    });
    expect(itemMatchesTopic(fields, outdoor)).toBe(true);
  });

  it('does not match unrelated cuisine', () => {
    const fields = extractItemDiscoveryFields('پیتزا هاوس', {
      cuisine: 'پیتزا',
    });
    expect(itemMatchesTopic(fields, sokhari)).toBe(false);
  });
});

describe('listTopicMatchLevel', () => {
  it('is strong when title signals the topic', () => {
    expect(
      listTopicMatchLevel(
        {
          title: 'بهترین سوخاری‌های تهران',
          description: null,
          tags: [],
          itemCount: 20,
        },
        sokhari,
        1
      )
    ).toBe('strong');
  });

  it('is strong when coverage and count pass threshold', () => {
    expect(
      listTopicMatchLevel(
        {
          title: 'کافه‌های غرب',
          description: null,
          tags: [],
          itemCount: 10,
        },
        outdoor,
        4
      )
    ).toBe('strong');
  });

  it('is weak when only one item matches without title signal', () => {
    expect(
      listTopicMatchLevel(
        {
          title: 'کافه‌های سعادت‌آباد',
          description: 'لیست عمومی',
          tags: [],
          itemCount: 20,
        },
        outdoor,
        1
      )
    ).toBe('weak');
  });

  it('is none with zero matches and no text signal', () => {
    expect(
      listTopicMatchLevel(
        {
          title: 'کافه‌های مرکز',
          description: null,
          tags: [],
          itemCount: 12,
        },
        breakfast,
        0
      )
    ).toBe('none');
  });

  it('is strong from list tags', () => {
    expect(
      listTopicMatchLevel(
        {
          title: 'لیست صبح',
          description: null,
          tags: ['صبحانه'],
          itemCount: 8,
        },
        breakfast,
        0
      )
    ).toBe('strong');
  });
});
