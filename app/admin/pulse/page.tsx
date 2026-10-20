import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import { loadPulseDashboard } from '@/lib/admin/pulse-dashboard-data';
import PulseDashboardClient from './PulseDashboardClient';

export const dynamic = 'force-dynamic';

function PulseSkeleton() {
  return (
    <div className="space-y-3" dir="rtl">
      <div className="h-11 animate-pulse rounded-xl bg-admin-muted" />
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-admin-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
        <div className="h-40 animate-pulse rounded-xl bg-admin-muted xl:col-span-7" />
        <div className="h-40 animate-pulse rounded-xl bg-admin-muted xl:col-span-5" />
      </div>
    </div>
  );
}

async function PulseData() {
  const initial = await loadPulseDashboard();
  return <PulseDashboardClient initial={initial} />;
}

export default async function PulseDashboardPage() {
  await requireAdmin();

  return (
    <Suspense fallback={<PulseSkeleton />}>
      <PulseData />
    </Suspense>
  );
}
