import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NewItemForm from './NewItemForm';

export const metadata: Metadata = {
  title: 'افزودن آیتم جدید - پنل ادمین',
  description: 'افزودن آیتم جدید به لیست',
};

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string }>;
}) {
  await requireAdmin();

  const { listId } = await searchParams;

  // Get all active lists
  const lists = await prisma.lists.findMany({
    where: { isActive: true },
    include: {
      categories: true,
    },
    orderBy: { title: 'asc' },
  });

  if (!lists || lists.length === 0) {
    redirect('/admin/lists');
  }

  // If listId is provided, verify it exists
  let selectedList = null;
  if (listId) {
    selectedList = lists.find((l) => l.id === listId);
    if (!selectedList) {
      redirect('/admin/items/new');
    }
  }

  return <NewItemForm lists={lists} initialListId={listId} />;
}
