import { requireAdmin } from '@/lib/auth';
import { getListWorkspaceData } from '@/lib/admin/list-workspace-data';
import ListWorkspaceClient from './ListWorkspaceClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const data = await getListWorkspaceData(id);
    return { title: `${data.list.title} | workspace لیست` };
  } catch {
    return { title: 'لیست | پنل ادمین' };
  }
}

export default async function ListWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const data = await getListWorkspaceData(id);

  return (
    <div className="px-4 py-6">
      <ListWorkspaceClient data={JSON.parse(JSON.stringify(data))} />
    </div>
  );
}
