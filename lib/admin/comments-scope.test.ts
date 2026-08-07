import { describe, expect, it } from 'vitest';
import { buildCommentsWhere } from './comments-intelligence';
import { parseCommentOrigin } from './comments-scope-utils';

describe('buildCommentsWhere scope filters', () => {
  it('filters seeded comments via origin', () => {
    const where = buildCommentsWhere('all', '', { origin: 'seeded' });
    expect(where.isSeeded).toBe(true);
    expect(where.deletedAt).toBeNull();
  });

  it('filters user comments via origin', () => {
    const where = buildCommentsWhere('approved', '', { origin: 'user' });
    expect(where.isSeeded).toBe(false);
    expect(where.isApproved).toBe(true);
  });

  it('filters by list id through items relation', () => {
    const where = buildCommentsWhere('all', '', { listId: 'list-1' });
    expect(where.items).toEqual({ listId: 'list-1' });
  });

  it('filters by category id through items.lists', () => {
    const where = buildCommentsWhere('all', '', { categoryId: 'cat-1' });
    expect(where.items).toEqual({ lists: { categoryId: 'cat-1' } });
  });

  it('prefers list id over category id', () => {
    const where = buildCommentsWhere('all', '', {
      categoryId: 'cat-1',
      listId: 'list-1',
    });
    expect(where.items).toEqual({ listId: 'list-1' });
  });
});

describe('parseCommentOrigin', () => {
  it('maps legacy filter=seeded to seeded origin', () => {
    expect(parseCommentOrigin(undefined, 'seeded')).toBe('seeded');
  });
});
