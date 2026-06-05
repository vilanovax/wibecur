import { describe, it, expect } from 'vitest';
import { slugifyCategoryName, buildSlugCandidates } from './category-slug';

describe('slugifyCategoryName', () => {
  it('slugifies English names', () => {
    expect(slugifyCategoryName('Best Movies')).toBe('best-movies');
  });

  it('transliterates common Persian category names', () => {
    expect(slugifyCategoryName('فیلم و سریال')).toBe('film-serial');
    expect(slugifyCategoryName('کافه و رستوران')).toContain('cafe');
    expect(slugifyCategoryName('کتاب')).toBe('book');
  });

  it('returns category fallback for empty result', () => {
    expect(slugifyCategoryName('---')).toBe('category');
  });
});

describe('buildSlugCandidates', () => {
  it('generates numbered variants', () => {
    expect(buildSlugCandidates('movies', 3)).toEqual(['movies', 'movies-2', 'movies-3', 'movies-4']);
  });
});
