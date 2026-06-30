import { describe, expect, it } from 'vitest';
import { pickBestTitleMatch, titleMatchScore } from '@/lib/books/title-match';

describe('titleMatchScore', () => {
  it('matches exact Persian titles', () => {
    expect(titleMatchScore('کیمیاگر', 'کیمیاگر')).toBe(100);
  });

  it('matches with book prefix stripped', () => {
    expect(titleMatchScore('کیمیاگر', 'کتاب کیمیاگر')).toBeGreaterThanOrEqual(88);
  });

  it('scores partial matches below exact', () => {
    const exact = titleMatchScore('کیمیاگر', 'کیمیاگر');
    const partial = titleMatchScore('کیمیاگر', 'کیمیاگر باش درونت طلاست');
    expect(exact).toBeGreaterThan(partial);
  });
});

describe('pickBestTitleMatch', () => {
  it('picks highest scoring candidate above threshold', () => {
    const best = pickBestTitleMatch(
      'کیمیاگر',
      [
        { title: 'هری پاتر' },
        { title: 'کیمیاگر' },
        { title: 'کیمیاگری روانی' },
      ],
      70
    );
    expect(best?.title).toBe('کیمیاگر');
    expect(best?.matchScore).toBe(100);
  });

  it('returns null when no candidate meets threshold', () => {
    const best = pickBestTitleMatch('کیمیاگر', [{ title: 'هری پاتر' }], 70);
    expect(best).toBeNull();
  });
});
