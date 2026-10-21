import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import AuditLogClient from '@/components/admin/audit/AuditLogClient';
import { listAuditLogs } from '@/lib/admin/audit-query';

export const dynamic = 'force-dynamic';

function AuditSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-28 animate-pulse rounded-2xl bg-[var(--color-border-muted)]" />
      <div className="h-80 animate-pulse rounded-2xl bg-[var(--color-border-muted)]" />
    </div>
  );
}

async function AuditData({
  searchParams,
}: {
  searchParams: Promise<{ actorQuery?: string }>;
}) {
  const params = await searchParams;
  const initial = await listAuditLogs({
    page: 1,
    pageSize: 20,
    actorQuery: params.actorQuery || undefined,
  });
  return (
    <AuditLogClient
      initialData={initial}
      initialActorQuery={params.actorQuery ?? ''}
    />
  );
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ actorQuery?: string }>;
}) {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">لاگ تغییرات</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          تاریخچهٔ عملیات حساس ادمین. روی هر ردیف بزنید تا جزئیات را ببینید.
        </p>
      </div>
      <Suspense fallback={<AuditSkeleton />}>
        <AuditData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
