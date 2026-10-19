import { Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PulseDashboardClient = nextDynamic(() => import('./PulseDashboardClient'), {
  loading: () => (
    <div
      className="py-16 text-center text-sm text-admin-text-tertiary animate-pulse"
      dir="rtl"
    >
      در حال بارگذاری پالس وایب…
    </div>
  ),
});

export default async function PulseDashboardPage() {
  await requireAdmin();

  return (
    <Suspense
      fallback={
        <div
          className="py-16 text-center text-sm text-admin-text-tertiary animate-pulse"
          dir="rtl"
        >
          در حال بارگذاری پالس وایب…
        </div>
      }
    >
      <PulseDashboardClient />
    </Suspense>
  );
}
