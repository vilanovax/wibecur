/**
 * اسنپشات minimal برای before/after — بدون آبجکت سنگین یا فیلدهای حساس
 */

export function minimalList(list: {
  id: string;
  title: string | null;
  slug: string | null;
  categoryId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  badge: string | null;
  updatedAt: Date;
  _count?: { bookmarks?: number };
}): Record<string, unknown> {
  return {
    id: list.id,
    title: list.title,
    slug: list.slug,
    categoryId: list.categoryId,
    isActive: list.isActive,
    isFeatured: list.isFeatured,
    badge: list.badge,
    updatedAt: list.updatedAt?.toISOString?.(),
    ...(list._count?.bookmarks != null && { saveCount: list._count.bookmarks }),
  };
}

export function minimalCategory(cat: {
  id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  updatedAt: Date;
  trendingWeight?: number;
}): Record<string, unknown> {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    order: cat.order,
    isActive: cat.isActive,
    trendingWeight: cat.trendingWeight,
    updatedAt: cat.updatedAt?.toISOString?.(),
  };
}

export function minimalUser(user: {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  updatedAt?: Date;
}): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    updatedAt: user.updatedAt?.toISOString?.() ?? undefined,
  };
}
