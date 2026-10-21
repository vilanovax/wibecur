import nextDynamic from 'next/dynamic';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const GrowthKPIDashboard = nextDynamic(() => import('./GrowthKPIDashboardClient'), {
  loading: () => (
    <div className="space-y-6" aria-hidden>
      <div className="h-16 animate-pulse rounded-xl bg-[var(--color-border-muted)]" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-border-muted)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-[var(--color-border-muted)]" />
        <div className="h-64 animate-pulse rounded-xl bg-[var(--color-border-muted)]" />
      </div>
    </div>
  ),
});

export default async function AdminKPIPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] dark:text-white">داشبورد رشد</h1>
        <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-subtle)] mt-1">
          وضعیت سیستم رشد — مانیتورینگ KPI و سلامت وایب
        </p>
      </div>
      <GrowthKPIDashboard />
    </div>
  );
}
