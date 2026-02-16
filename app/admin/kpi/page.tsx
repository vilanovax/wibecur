import { requireAdmin } from '@/lib/auth';
import GrowthKPIDashboard from './GrowthKPIDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminKPIPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">داشبورد رشد</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          وضعیت سیستم رشد — مانیتورینگ KPI و سلامت وایب
        </p>
      </div>
      <GrowthKPIDashboard />
    </div>
  );
}
