import { redirect } from 'next/navigation';

export default async function BulkImportRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string; categoryId?: string }>;
}) {
  const { listId, categoryId } = await searchParams;
  const next = new URLSearchParams();
  next.set('view', 'import');
  if (listId) next.set('listId', listId);
  if (categoryId) next.set('categoryId', categoryId);
  redirect(`/admin/lists?${next.toString()}`);
}
