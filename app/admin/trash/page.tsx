import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import TrashPageClient from '@/components/admin/trash/TrashPageClient';
import {
  getTrashCategories,
  getTrashCounts,
  getTrashItems,
  getTrashLists,
  type TrashEntity,
} from '@/lib/admin/trash-hub';

export const dynamic = 'force-dynamic';

const VALID_TABS = new Set<TrashEntity>(['lists', 'categories', 'items']);

function parseTab(raw: string | undefined): TrashEntity {
  if (raw && VALID_TABS.has(raw as TrashEntity)) return raw as TrashEntity;
  return 'lists';
}

async function loadInitial(tab: TrashEntity) {
  const [counts, items] = await Promise.all([
    getTrashCounts(),
    tab === 'lists'
      ? getTrashLists()
      : tab === 'categories'
        ? getTrashCategories()
        : getTrashItems(),
  ]);
  return { counts, items };
}

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminTrashPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab = parseTab(tabParam);
  const { counts, items } = await loadInitial(tab);

  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-[var(--color-text-muted)]">در حال بارگذاری…</div>}>
      <TrashPageClient initialTab={tab} initialCounts={counts} initialItems={items} />
    </Suspense>
  );
}
