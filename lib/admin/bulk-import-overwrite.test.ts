import { describe, expect, it } from 'vitest';
import { buildCatalogJsonOverwritePatch } from '@/lib/admin/bulk-import-execute';

const existing = {
  title: 'بار هستی',
  description: 'توضیح قبلی',
  imageUrl: 'https://cdn.example/old.webp',
  externalUrl: 'https://example.com/old',
  metadata: {
    author: 'میلان کوندرا',
    tip: 'نکتهٔ قبلی',
    genre: 'رمان',
  },
};

describe('buildCatalogJsonOverwritePatch', () => {
  it('keeps absent description, externalUrl, image and metadata keys', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      { title: 'بار هستی (میلان کوندرا)' },
      { categorySlug: 'bookspodcast', incomingMeta: {} }
    );

    expect(patch.title).toBe('بار هستی (میلان کوندرا)');
    expect(patch).not.toHaveProperty('description');
    expect(patch).not.toHaveProperty('externalUrl');
    expect(patch).not.toHaveProperty('imageUrl');
    expect(patch.metadata).toEqual(existing.metadata);
  });

  it('updates only provided scalar fields', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      {
        title: 'بار هستی',
        description: 'توضیح جدید',
        externalUrl: '',
      },
      { categorySlug: 'bookspodcast', incomingMeta: {} }
    );

    expect(patch.description).toBe('توضیح جدید');
    expect(patch.externalUrl).toBeNull();
    expect(patch).not.toHaveProperty('imageUrl');
    expect(patch.metadata).toEqual(existing.metadata);
  });

  it('merges incoming metadata without wiping other keys', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      { title: 'بار هستی', metadata: { author: 'کوندرا' } },
      {
        categorySlug: 'bookspodcast',
        incomingMeta: { author: 'کوندرا' },
      }
    );

    expect(patch.metadata).toEqual({
      author: 'کوندرا',
      tip: 'نکتهٔ قبلی',
      genre: 'رمان',
    });
  });

  it('applies top-level tip without dropping other metadata', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      { title: 'بار هستی', tip: 'نکتهٔ جدید' },
      { categorySlug: 'bookspodcast', incomingMeta: {} }
    );

    expect(patch.metadata).toEqual({
      author: 'میلان کوندرا',
      tip: 'نکتهٔ جدید',
      genre: 'رمان',
    });
  });
});
