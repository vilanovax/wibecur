import { Suspense } from 'react';
import { requireAdmin } from '@/lib/auth';
import PulseDashboardClient from './PulseDashboardClient';

export const dynamic = 'force-dynamic';

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
