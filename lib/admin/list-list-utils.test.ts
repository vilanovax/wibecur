import { describe, expect, it } from 'vitest';
import { listHasMissingCover, parseListFilterParam } from '@/lib/admin/list-list-utils';

describe('parseListFilterParam', () => {
  it('returns no_cover for deep links from content hub stats', () => {
    expect(parseListFilterParam('no_cover')).toBe('no_cover');
  });

  it('falls back to all for unknown values', () => {
    expect(parseListFilterParam('invalid')).toBe('all');
    expect(parseListFilterParam(undefined)).toBe('all');
  });
});

describe('listHasMissingCover', () => {
  it('treats empty and generic covers as missing', () => {
    expect(listHasMissingCover({ coverImage: null })).toBe(true);
    expect(listHasMissingCover({ coverImage: '' })).toBe(true);
    expect(listHasMissingCover({ coverImage: '/images/banners/movies.webp' })).toBe(true);
  });

  it('accepts real uploaded covers', () => {
    expect(
      listHasMissingCover({
        coverImage: 'https://storage.parspack.com/wibe/uploads/custom-cover.jpg',
      })
    ).toBe(false);
  });
});
