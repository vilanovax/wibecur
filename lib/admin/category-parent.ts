import type { PrismaClient } from '@prisma/client';

export type CategoryParentOption = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

/**
 * فقط دسته‌های ریشه (بدون مادر) می‌توانند مادر باشند — سلسله‌مراتب یک‌سطحی.
 */
export async function listCategoryParentOptions(
  prisma: PrismaClient,
  opts?: { excludeId?: string }
): Promise<CategoryParentOption[]> {
  return prisma.categories.findMany({
    where: {
      deletedAt: null,
      parentId: null,
      ...(opts?.excludeId ? { id: { not: opts.excludeId } } : {}),
    },
    select: { id: true, name: true, slug: true, icon: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });
}

/**
 * نرمال و اعتبارسنجی parentId برای ساخت/ویرایش دسته.
 * - خالی → null
 * - خود دسته ممنوع
 * - مادر باید وجود داشته باشد، حذف‌شده نباشد و خودش ریشه باشد
 * - اگر این دسته الان مادرِ دیگری است، نمی‌تواند زیر مادر برود (یک سطح)
 */
export async function resolveCategoryParentId(
  prisma: PrismaClient,
  opts: {
    categoryId?: string;
    parentId: unknown;
  }
): Promise<{ ok: true; parentId: string | null } | { ok: false; error: string }> {
  const raw =
    typeof opts.parentId === 'string' ? opts.parentId.trim() : opts.parentId == null ? '' : '';
  if (!raw) return { ok: true, parentId: null };

  if (opts.categoryId && raw === opts.categoryId) {
    return { ok: false, error: 'دسته نمی‌تواند مادر خودش باشد' };
  }

  const parent = await prisma.categories.findUnique({
    where: { id: raw },
    select: { id: true, parentId: true, deletedAt: true, name: true },
  });
  if (!parent || parent.deletedAt) {
    return { ok: false, error: 'دستهٔ مادر یافت نشد' };
  }
  if (parent.parentId) {
    return {
      ok: false,
      error: 'فقط دسته‌های سطح اول می‌توانند مادر باشند (سلسله‌مراتب یک‌سطحی)',
    };
  }

  if (opts.categoryId) {
    const childCount = await prisma.categories.count({
      where: { parentId: opts.categoryId, deletedAt: null },
    });
    if (childCount > 0) {
      return {
        ok: false,
        error: 'این دسته خودش مادر است؛ ابتدا زیردسته‌ها را جابه‌جا کنید',
      };
    }
  }

  return { ok: true, parentId: parent.id };
}
