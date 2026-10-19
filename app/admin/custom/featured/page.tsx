import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getCachedFeaturedManagementData } from '@/lib/admin/featured-management-cached';
import FeaturedManagementClient from './FeaturedManagementClient';

export const dynamic = 'force-dynamic';

function FeaturedSkeleton() {
  return (
    <div className="space-y-6 animate-pulse pb-8" dir="rtl">
      <div className="h-16 rounded-2xl bg-[var(--color-border-muted)]" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl bg-[var(--color-border-muted)]"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="h-64 rounded-2xl bg-[var(--color-border-muted)]" />
        <div className="h-80 rounded-2xl bg-[var(--color-border-muted)]" />
      </div>
      <div className="h-40 rounded-2xl bg-[var(--color-border-muted)]" />
    </div>
  );
}

async function FeaturedDataSection() {
  const data = await getCachedFeaturedManagementData();
  return <FeaturedManagementClient initialData={data} />;
}

export default async function AdminCustomFeaturedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab } = await searchParams;
  if (tab === 'weekly-report') {
    redirect('/admin/custom/featured');
  }
  return (
    <Suspense fallback={<FeaturedSkeleton />}>
      <FeaturedDataSection />
    </Suspense>
  );
}
