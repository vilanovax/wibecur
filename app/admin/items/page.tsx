import { redirect } from 'next/navigation';

export default async function AdminItemsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  next.set('view', 'catalog');
  if (params.listId) next.set('listId', params.listId);
  if (params.categoryId) next.set('category', params.categoryId);
  if (params.page) next.set('page', params.page);
  redirect(`/admin/lists?${next.toString()}`);
}
