import { describe, expect, it } from 'vitest';
import {
  buildCatalogJsonOverwritePatch,
  pickNonEmptyMetadataUpdates,
} from '@/lib/admin/bulk-import-execute';

const existing = {
  title: 'بار هستی',
  description: 'توضیح قبلی',
  imageUrl: 'https://cdn.example/old.webp',
  externalUrl: 'https://example.com/old',
  metadata: {
    author: 'میلان کوندرا',
    tip: 'نکتهٔ قبلی',
    genre: 'رمان',
    searchProfile: {
      genres: ['رمان'],
      subgenres: [],
      themes: ['عشق'],
      keywords: ['کوندرا'],
      searchText: 'سبکی تحمل‌ناپذیر هستی میلان کوندرا',
    },
    entryKind: 'catalog_ref',
    sourceCategorySlug: 'bookspodcast',
  },
};

describe('pickNonEmptyMetadataUpdates', () => {
  it('drops blank strings and empty arrays', () => {
    expect(
      pickNonEmptyMetadataUpdates({
        author: 'کوندرا',
        tip: '  ',
        genre: '',
        tags: [],
        year: 1984,
      })
    ).toEqual({ author: 'کوندرا', year: 1984 });
  });
});

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

  it('does not clear description or externalUrl when JSON sends empty strings', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      {
        title: 'بار هستی',
        description: '',
        externalUrl: '   ',
        imageUrl: '',
        tip: '',
        metadata: { author: '', genre: 'فلسفه' },
      },
      {
        categorySlug: 'bookspodcast',
        incomingMeta: { author: '', genre: 'فلسفه' },
      }
    );

    expect(patch).not.toHaveProperty('description');
    expect(patch).not.toHaveProperty('externalUrl');
    expect(patch).not.toHaveProperty('imageUrl');
    expect(patch.metadata).toEqual({
      ...existing.metadata,
      genre: 'فلسفه',
    });
  });

  it('updates only provided non-empty scalar fields', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      {
        title: 'بار هستی',
        description: 'توضیح جدید',
        externalUrl: 'https://example.com/new',
      },
      { categorySlug: 'bookspodcast', incomingMeta: {} }
    );

    expect(patch.description).toBe('توضیح جدید');
    expect(patch.externalUrl).toBe('https://example.com/new');
    expect(patch).not.toHaveProperty('imageUrl');
    expect(patch.metadata).toEqual(existing.metadata);
  });

  it('merges incoming metadata without wiping searchProfile or tip', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      { title: 'بار هستی', metadata: { author: 'کوندرا' } },
      {
        categorySlug: 'bookspodcast',
        incomingMeta: { author: 'کوندرا' },
      }
    );

    expect(patch.metadata).toEqual({
      ...existing.metadata,
      author: 'کوندرا',
    });
  });

  it('keeps entryKind and sourceCategorySlug from JSON on bookspodcast overwrite', () => {
    const bare = {
      ...existing,
      metadata: { author: 'کسی', genre: 'فرهنگ', tip: 'نکته' },
    };
    const patch = buildCatalogJsonOverwritePatch(
      bare,
      {
        title: 'پادکست داکس',
        metadata: {
          entryKind: 'catalog_ref',
          sourceCategorySlug: 'bookspodcast',
          author: 'کسی',
        },
      },
      {
        categorySlug: 'bookspodcast',
        incomingMeta: {
          entryKind: 'catalog_ref',
          sourceCategorySlug: 'bookspodcast',
          author: 'کسی',
        },
      }
    );

    expect(patch.metadata).toMatchObject({
      entryKind: 'catalog_ref',
      sourceCategorySlug: 'bookspodcast',
      author: 'کسی',
      tip: 'نکته',
    });
  });

  it('applies top-level tip without dropping other metadata', () => {
    const patch = buildCatalogJsonOverwritePatch(
      existing,
      { title: 'بار هستی', tip: 'نکتهٔ جدید' },
      { categorySlug: 'bookspodcast', incomingMeta: {} }
    );

    expect(patch.metadata).toEqual({
      ...existing.metadata,
      tip: 'نکتهٔ جدید',
    });
  });
});
