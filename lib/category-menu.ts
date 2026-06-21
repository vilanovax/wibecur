import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import { activeCategoryWhere } from '@/lib/public-content-filters';

export type CategoryMenuChip = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
};

export async function fetchActiveCategoryMenu(): Promise<CategoryMenuChip[]> {
  return dbQuery(() =>
    prisma.categories.findMany({
      where: activeCategoryWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
      orderBy: { order: 'asc' },
    })
  );
}
