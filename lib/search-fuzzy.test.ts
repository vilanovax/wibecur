import { describe, expect, it } from 'vitest';
import {
  buildFuzzyDbAnchors,
  fuzzyMatchInText,
  fuzzyTokenEquals,
  levenshteinDistance,
} from '@/lib/search-fuzzy';
import { scoreItemForSearch } from '@/lib/search-keywords';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('inception', 'inception')).toBe(0);
  });

  it('handles single typo', () => {
    expect(levenshteinDistance('inseption', 'inception')).toBe(1);
  });

  it('handles missing letter', () => {
    expect(levenshteinDistance('incepion', 'inception')).toBe(1);
  });
});

describe('fuzzyTokenEquals', () => {
  it('matches common movie title typos', () => {
    expect(fuzzyTokenEquals('inseption', 'inception')).toBe(true);
    expect(fuzzyTokenEquals('incepion', 'inception')).toBe(true);
    expect(fuzzyTokenEquals('inception', 'inception')).toBe(true);
  });

  it('rejects unrelated words', () => {
    expect(fuzzyTokenEquals('matrix', 'inception')).toBe(false);
  });
});

describe('fuzzyMatchInText', () => {
  it('finds typo in title text', () => {
    const match = fuzzyMatchInText('inseption', 'Inception - تلقین');
    expect(match.matched).toBe(true);
    expect(match.matchedText?.toLowerCase()).toContain('inception');
  });
});

describe('buildFuzzyDbAnchors', () => {
  it('produces shared substring for typo queries', () => {
    const anchors = buildFuzzyDbAnchors('inseption');
    expect(anchors.some((a) => 'inception'.includes(a))).toBe(true);
  });
});

describe('scoreItemForSearch fuzzy', () => {
  it('scores typo title match with hint', () => {
    const result = scoreItemForSearch(
      { title: 'Inception - تلقین', catalogTitle: 'Inception' },
      'inseption'
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toBe('title');
    expect(result.matchHint).toContain('شبیه');
  });
});
