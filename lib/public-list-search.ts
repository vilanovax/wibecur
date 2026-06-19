import type { Prisma } from '@prisma/client';
import { publicCuratedListWhere } from '@/lib/public-content-filters';
import { normalizeSearchQuery } from '@/lib/list-search';
import { buildExtendedListSearchOrClauses } from '@/lib/search-keywords';

/** شرط Prisma برای جستجوی لیست‌های عمومی — عنوان/توضیح/دسته/تگ + آیتم‌ها و متادیتا */
export function buildPublicListSearchWhere(rawQuery: string): Prisma.listsWhereInput {
  const q = normalizeSearchQuery(rawQuery);
  return {
    ...publicCuratedListWhere,
    OR: buildExtendedListSearchOrClauses(q),
  };
}
