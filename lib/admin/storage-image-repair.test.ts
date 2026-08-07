import { describe, expect, it } from 'vitest';
import { buildCatalogRepairSearchQuery } from '@/lib/admin/storage-image-repair';

describe('buildCatalogRepairSearchQuery', () => {
  it('uses cafe query builder for cafe slug', () => {
    const query = buildCatalogRepairSearchQuery({
      title: 'کافه طهرون',
      categorySlug: 'cafe',
      metadata: { address: 'تهران' },
    });
    expect(query).toBe('رستوران کافه کافه طهرون');
  });

  it('adds poster hint for movies', () => {
    const query = buildCatalogRepairSearchQuery({
      title: 'Inception',
      categorySlug: 'movie',
    });
    expect(query).toContain('Inception');
    expect(query.toLowerCase()).toContain('poster');
  });
});
