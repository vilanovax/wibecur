import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCatalogItemDetail, isCatalogClientReady } from '@/lib/catalog-items';
import CatalogEditForm from './CatalogEditForm';

export default async function CatalogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  if (!isCatalogClientReady(prisma)) {
    notFound();
  }

  const [detail, categories] = await Promise.all([
    getCatalogItemDetail(prisma, id),
    prisma.categories.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, slug: true, icon: true },
    }),
  ]);
  if (!detail) notFound();

  return (
    <CatalogEditForm
      categories={categories}
      catalog={{
        id: detail.id,
        title: detail.title,
        description: detail.description,
        imageUrl: detail.imageUrl,
        externalUrl: detail.externalUrl,
        categorySlug: detail.categorySlug,
        metadata: detail.metadata,
        listCount: detail.listCount,
        isDisabled: detail.isDisabled,
      }}
    />
  );
}
