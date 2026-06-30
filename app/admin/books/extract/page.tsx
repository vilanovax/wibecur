import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import BookExtractClient from '@/components/admin/books/BookExtractClient';

export default async function BookExtractPage() {
  await requireAdmin();

  const lists = await prisma.lists.findMany({
    where: { deletedAt: null },
    include: { categories: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return (
    <BookExtractClient
      lists={lists.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        categoryId: l.categoryId,
        categories: l.categories,
      }))}
    />
  );
}
