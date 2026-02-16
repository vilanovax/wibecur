import { requireAdmin } from '@/lib/auth';
import { getListsIntelligenceData } from '@/lib/admin/lists-intelligence';
import ListsIntelligenceClient from './ListsIntelligenceClient';

export default async function AdminListsPage({
  searchParams,
}: {
  searchParams: Promise<{ trash?: string }>;
}) {
  await requireAdmin();
  const { trash: trashParam } = await searchParams;
  const trash = trashParam === 'true';
  const data = await getListsIntelligenceData(trash);

  return <ListsIntelligenceClient data={data} trash={trash} />;
}
