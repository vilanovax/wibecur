import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

import { BOOK_SLUG_ALIASES, FILM_SLUG_ALIASES, resolveCategorySlugAliases } from '@/lib/category-slug-aliases';

function isLikelyCategoryId(param: string): boolean {
  const raw = param.trim();
  if (raw.length < 12 || !/^[a-zA-Z0-9_-]+$/.test(raw)) return false;
  // nanoid/cuid-style ids often include mixed case or underscores
  if (/[A-Z]/.test(raw) || raw.includes('_')) return true;
  // long opaque tokens without slug-like hyphens
  return raw.length >= 20 && !raw.includes('-');
}

/** @deprecated use isLikelyCategoryId */
function isLikelyCuid(param: string): boolean {
  return isLikelyCategoryId(param);
}

export type ResolvedCategory = {
  id: string;
  name: string;
  slug: string;
  layoutType: string | null;
};

/**
 * یافتن دسته فعال از slug یا id.
 * با React cache() تا در یک request فقط یک کوئری بزند (generateMetadata + بدنهٔ صفحه).
 */
export const resolveCategoryBySlug = cache(async (
  slug: string
): Promise<ResolvedCategory | null> => {
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
});

/** یافتن شناسه دسته از slug یا id */
export async function resolveCategoryId(param: string): Promise<string | null> {
  const category = await resolveCategoryBySlug(param);
  return category?.id ?? null;
}
