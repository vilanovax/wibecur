import { describe, expect, it } from 'vitest';
import {
  resolveInterestKeywordId,
  scoreListKeywordMatch,
  isValidInterestKeywordId,
} from '@/lib/interest-keywords';

describe('interest-keywords', () => {
  it('resolves Persian and English aliases', () => {
    expect(resolveInterestKeywordId('اکشن')).toBe('action');
    expect(resolveInterestKeywordId('coffee')).toBe('coffee');
    expect(resolveInterestKeywordId('قهوه')).toBe('coffee');
    expect(resolveInterestKeywordId('unknown-xyz')).toBeNull();
  });

  it('scores list by tags and title', () => {
    const score = scoreListKeywordMatch(
      { title: 'بهترین کافه‌های تهران', tags: ['قهوه'], category: { name: 'کافه' } },
      ['coffee', 'tehran']
    );
    expect(score).toBe(2);
  });

  it('validates catalog ids', () => {
    expect(isValidInterestKeywordId('action')).toBe(true);
    expect(isValidInterestKeywordId('not-real')).toBe(false);
  });
});
