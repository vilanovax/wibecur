import { describe, expect, it } from 'vitest';
import { buildListItemPreviewPath } from '@/lib/list-item-preview-url';

describe('buildListItemPreviewPath', () => {
  it('builds list item preview hash link', () => {
    expect(buildListItemPreviewPath('best-comedy-books', 'abc-123')).toBe(
      '/lists/best-comedy-books#item-abc-123'
    );
  });

  it('encodes item id in hash', () => {
    expect(buildListItemPreviewPath('best-comedy-books', 'id/with space')).toBe(
      '/lists/best-comedy-books#item-id%2Fwith%20space'
    );
  });

  it('returns empty when slug or id missing', () => {
    expect(buildListItemPreviewPath('', 'x')).toBe('');
    expect(buildListItemPreviewPath('slug', '')).toBe('');
  });
});
