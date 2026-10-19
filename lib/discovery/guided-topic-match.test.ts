import { describe, expect, it } from 'vitest';
import { listMatchesGuidedTopic } from '@/lib/discovery/guided-recommendations';

describe('listMatchesGuidedTopic', () => {
  it('keeps film lists out of کتاب rows even if title mentions کتاب', () => {
    expect(
      listMatchesGuidedTopic(
        {
          id: '1',
          slug: 'books-made-into-films',
          title: 'کتابهایی که فیلم شدند',
          description: '',
          coverImage: '',
          saveCount: 0,
          itemCount: 1,
          category: { name: 'فیلم و سریال', slug: 'film-serial', icon: '🎬' },
        },
        'کتاب'
      )
    ).toBe(false);
  });

  it('keeps book-category lists in کتاب rows', () => {
    expect(
      listMatchesGuidedTopic(
        {
          id: '2',
          slug: 'horror-books',
          title: 'کتابهای ترسناک',
          description: '',
          coverImage: '',
          saveCount: 0,
          itemCount: 1,
          category: { name: 'کتاب و پادکست', slug: 'books', icon: '📚' },
        },
        'کتاب'
      )
    ).toBe(true);
  });

  it('keeps book lists out of فیلم rows', () => {
    expect(
      listMatchesGuidedTopic(
        {
          id: '3',
          slug: 'book-adaptations',
          title: 'فیلمهای اقتباسی از کتاب',
          description: '',
          coverImage: '',
          saveCount: 0,
          itemCount: 1,
          category: { name: 'کتاب و پادکست', slug: 'books', icon: '📚' },
        },
        'فیلم'
      )
    ).toBe(false);
  });

  it('matches travel lists for سفر rows (with_friend / going_out)', () => {
    expect(
      listMatchesGuidedTopic(
        {
          id: '4',
          slug: 'iran-travel',
          title: 'مقاصد سفر ایران',
          description: '',
          coverImage: '',
          saveCount: 0,
          itemCount: 1,
          category: { name: 'سفر', slug: 'travel', icon: '✈️' },
        },
        'سفر'
      )
    ).toBe(true);
  });

  it('keeps cafe lists in کافه rows for going_out', () => {
    expect(
      listMatchesGuidedTopic(
        {
          id: '5',
          slug: 'breakfast-cafes',
          title: 'کافه‌های صبحانه عالی',
          description: '',
          coverImage: '',
          saveCount: 105,
          itemCount: 24,
          category: { name: 'کافه', slug: 'cafe', icon: '☕' },
        },
        'کافه'
      )
    ).toBe(true);
  });
});
