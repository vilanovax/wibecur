import { redirect } from 'next/navigation';

export default async function AdminCatalogRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const next = new URLSearchParams();
  next.set('view', 'catalog');
  for (const [key, value] of Object.entries(params)) {
    if (value) next.set(key, value);
  }
  redirect(`/admin/lists?${next.toString()}`);
}
