import { requireAdmin } from '@/lib/auth';
import { Suspense } from 'react';
import UsersPageClient from './UsersPageClient';
import { getCachedUsersIntelligenceData } from '@/lib/admin/users-intelligence-cached';
import { parseUserSort } from '@/lib/admin/users-intelligence';
import { parseUserFilter } from '@/lib/admin/user-filter-utils';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    trash?: string;
    hideBots?: string;
    filter?: string;
    sort?: string;
  }>;
}) {
  await requireAdmin();

  const {
    page = '1',
    search = '',
    trash: trashParam = '',
    hideBots: hideBotsParam = '',
    filter: filterParam = '',
    sort: sortParam = '',
  } = await searchParams;

  const data = await getCachedUsersIntelligenceData({
    page: Math.max(1, parseInt(page, 10) || 1),
    search,
    filter: parseUserFilter(filterParam),
    hideBots: hideBotsParam !== 'false',
    sort: parseUserSort(sortParam),
    trash: trashParam === 'true',
  });

  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">
          در حال بارگذاری کاربران…
        </div>
      }
    >
      <UsersPageClient data={data} />
    </Suspense>
  );
}
