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
      <div className="h-11 rounded-xl bg-[var(--color-border-muted)]" />
      <div className="h-11 rounded-xl bg-[var(--color-border-muted)]" />
      <div className="h-80 rounded-2xl bg-[var(--color-border-muted)]" />
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
