import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

import { BOOK_SLUG_ALIASES, FILM_SLUG_ALIASES, resolveCategorySlugAliases } from '@/lib/category-slug-aliases';

function isLikelyCuid(param: string): boolean {
  return param.length >= 20 && param.length <= 30 && /^[a-z0-9]+$/i.test(param);
}

export type ResolvedCategory = {
  id: string;
  name: string;
  slug: string;
  layoutType: string | null;
};

/** یافتن دسته فعال از slug یا id */
export async function resolveCategoryBySlug(slug: string): Promise<ResolvedCategory | null> {
  const raw = (slug || '').trim();
  if (!raw) return null;

  let category = await dbQuery(() =>
    isLikelyCuid(raw)
      ? prisma.categories.findUnique({
          where: { id: raw, isActive: true },
          select: { id: true, name: true, slug: true, layoutType: true },
        })
      : prisma.categories.findUnique({
          where: { slug: raw, isActive: true },
          select: { id: true, name: true, slug: true, layoutType: true },
        })
  );

  const aliases = resolveCategorySlugAliases(raw);
  if (!category && !isLikelyCuid(raw) && aliases.length > 0) {
    category = await dbQuery(() =>
      prisma.categories.findFirst({
        where: { slug: { in: aliases }, isActive: true },
        select: { id: true, name: true, slug: true, layoutType: true },
      })
    );
  }

  return category;
}
