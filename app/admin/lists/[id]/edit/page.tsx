import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import { getListIntelligenceForEdit } from '@/lib/admin/trending-debug';
import EditListForm from './EditListForm';

export default async function EditListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const [list, categories, intelligence] = await Promise.all([
    prisma.lists.findUnique({
      where: { id },
      include: {
        categories: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        items: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            catalogItemId: true,
          },
        },
      },
    }),
    prisma.categories.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: 'desc' }, { order: 'asc' }, { name: 'asc' }],
    }),
    getListIntelligenceForEdit(id),
  ]);

  if (!list) {
    notFound();
  }

  if (list.deletedAt) {
    redirect(`/admin/trash?tab=lists&highlight=${list.id}`);
  }

  const serializedList = JSON.parse(JSON.stringify(list));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedIntelligence = intelligence
    ? JSON.parse(JSON.stringify(intelligence))
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" dir="rtl">
      <EditListForm
        list={serializedList}
        categories={serializedCategories}
        intelligence={serializedIntelligence}
      />
    </div>
  );
}
