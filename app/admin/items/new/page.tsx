import { redirect } from 'next/navigation';

/** @deprecated — فرم ساخت در hub: ?view=catalog&mode=create */
export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ listId?: string }>;
}) {
  const { listId } = await searchParams;
  const params = new URLSearchParams({ view: 'catalog', mode: 'create' });
  if (listId) params.set('listId', listId);
  redirect(`/admin/lists?${params.toString()}`);
}
