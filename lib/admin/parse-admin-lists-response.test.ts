import { describe, expect, it } from 'vitest';
import { parseAdminListsResponse } from './parse-admin-lists-response';

describe('parseAdminListsResponse', () => {
  it('accepts the paginated payload', () => {
    const parsed = parseAdminListsResponse<{ id: string }>({
      items: [{ id: 'a' }, { id: 'b' }],
      total: 40,
      page: 2,
      pageSize: 20,
      totalPages: 2,
      hasMore: false,
    });
    expect(parsed.items).toHaveLength(2);
    expect(parsed.page).toBe(2);
    expect(parsed.hasMore).toBe(false);
  });

  it('falls back for a legacy array payload', () => {
    const parsed = parseAdminListsResponse<{ id: string }>([{ id: 'x' }]);
    expect(parsed.items).toEqual([{ id: 'x' }]);
    expect(parsed.total).toBe(1);
    expect(parsed.hasMore).toBe(false);
  });

  it('returns empty for junk input', () => {
    expect(parseAdminListsResponse(null).items).toEqual([]);
  });
});
