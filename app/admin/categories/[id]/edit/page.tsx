import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { notFound } from 'next/navigation';
import CategoryEditForm from './CategoryEditForm';

export default async function EditCategoryPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const category = await prisma.categories.findUnique({
    where: { id: params.id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <CategoryEditForm category={category} />
    </div>
  );
}
