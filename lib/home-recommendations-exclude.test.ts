import { describe, expect, it } from 'vitest';
import { buildRecommendationExcludeIds } from '@/lib/home-recommendations';

describe('buildRecommendationExcludeIds', () => {
  it('drops saved and liked lists and keeps lists the viewer created', () => {
    const excluded = buildRecommendationExcludeIds(['saved-1', 'saved-2'], ['liked-1']);
    expect(excluded.has('saved-1')).toBe(true);
    expect(excluded.has('liked-1')).toBe(true);
    expect(excluded.has('owned-unsaved')).toBe(false);
  });
});
