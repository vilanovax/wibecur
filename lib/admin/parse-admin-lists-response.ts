/**
 * پاسخ صفحه‌بندی‌شدهٔ GET /api/admin/lists را به آرایهٔ آیتم تبدیل می‌کند.
 */

export type AdminListsPageResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
};

export function parseAdminListsResponse<T>(data: unknown): AdminListsPageResponse<T> {
  if (Array.isArray(data)) {
    return {
      items: data as T[],
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
      hasMore: false,
    };
  }
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    const body = data as Partial<AdminListsPageResponse<T>>;
    const items = body.items ?? [];
    const page = typeof body.page === 'number' && body.page > 0 ? body.page : 1;
    const pageSize =
      typeof body.pageSize === 'number' && body.pageSize > 0 ? body.pageSize : items.length;
    const total = typeof body.total === 'number' ? body.total : items.length;
    const totalPages =
      typeof body.totalPages === 'number' && body.totalPages > 0
        ? body.totalPages
        : Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: Boolean(body.hasMore ?? page < totalPages),
    };
  }
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 1,
    hasMore: false,
  };
}
