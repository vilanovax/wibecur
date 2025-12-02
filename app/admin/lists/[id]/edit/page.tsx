import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';
import EditListForm from './EditListForm';

export default async function EditListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const [list, categories] = await Promise.all([
    prisma.lists.findUnique({
      where: { id },
      include: {
        categories: true,
        items: {
          orderBy: { order: 'asc' },
        },
      },
    }),
    prisma.categories.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  if (!list) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <EditListForm list={list} categories={categories} />
    </div>
  );
}
