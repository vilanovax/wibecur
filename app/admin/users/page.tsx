import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import UsersPageClient from './UsersPageClient';
import { getCachedUsersIntelligenceData } from '@/lib/admin/users-intelligence-cached';
import { parseUserSort } from '@/lib/admin/users-types';
import { parseUserFilter } from '@/lib/admin/user-filter-utils';

function UsersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" dir="rtl">
      <div className="h-16 rounded-2xl bg-[var(--color-border-muted)]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-[var(--color-border-muted)]"
          />
        ))}
      </div>
      <div className="h-12 rounded-xl bg-[var(--color-border-muted)]" />
      <div className="h-[420px] rounded-2xl bg-[var(--color-border-muted)]" />
    </div>
  );
}

async function UsersDataSection({
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

  return <UsersPageClient data={data} />;
}

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

  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersDataSection searchParams={searchParams} />
    </Suspense>
  );
}
