import { requireAdmin } from '@/lib/auth';
import GrowthKPIDashboard from './GrowthKPIDashboardClient';

export const dynamic = 'force-dynamic';

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
