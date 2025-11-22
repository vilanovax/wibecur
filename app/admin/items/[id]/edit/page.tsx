import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EditItemForm from './EditItemForm';

export const metadata = {
  title: 'ویرایش آیتم | پنل مدیریت',
  description: 'ویرایش آیتم',
};

interface EditItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params;

  // Fetch the item with relations
  const item = await prisma.items.findUnique({
    where: { id },
    include: {
      lists: {
        include: {
          categories: true,
        },
      },
    },
  });

  if (!item) {
    notFound();
  }

  // Fetch all active lists for the dropdown
  const lists = await prisma.lists.findMany({
    where: { isActive: true },
    include: {
      categories: true,
    },
    orderBy: { title: 'asc' },
  });

  return (
    <EditItemForm
      item={JSON.parse(JSON.stringify(item))}
      lists={JSON.parse(JSON.stringify(lists))}
    />
  );
}
