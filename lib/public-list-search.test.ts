import { describe, expect, it } from 'vitest';
import { buildPublicListSearchWhere } from '@/lib/public-list-search';

describe('buildPublicListSearchWhere', () => {
  it('includes item title search in OR conditions', () => {
    const where = buildPublicListSearchWhere('king');
    const or = where.OR as Array<Record<string, unknown>>;
    expect(Array.isArray(or)).toBe(true);
    const hasItemTitle = or.some(
      (clause) =>
        typeof clause.items === 'object' &&
        clause.items !== null &&
        'some' in (clause.items as object)
    );
    expect(hasItemTitle).toBe(true);
  });

  it('includes metadata genre search on nested items', () => {
    const where = buildPublicListSearchWhere('اکشن');
    const or = where.OR as Array<Record<string, unknown>>;
    const hasGenre = or.some((clause) => {
      const items = clause.items as { some?: { OR?: unknown[] } } | undefined;
      if (!items?.some?.OR) return false;
      return items.some.OR.some(
        (part) =>
          typeof part === 'object' &&
          part !== null &&
          'metadata' in (part as object)
      );
    });
    expect(hasGenre).toBe(true);
  });
});
