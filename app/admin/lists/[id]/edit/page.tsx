import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';
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
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.categories.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
    getListIntelligenceForEdit(id),
  ]);

  if (!list) {
    notFound();
  }

  const serializedList = JSON.parse(JSON.stringify(list));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedIntelligence = intelligence
    ? JSON.parse(JSON.stringify(intelligence))
    : null;

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      <EditListForm
        list={serializedList}
        categories={serializedCategories}
        intelligence={serializedIntelligence}
      />
    </div>
  );
}
