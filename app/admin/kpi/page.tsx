import { requireAdmin } from '@/lib/auth';
import GrowthKPIDashboard from './GrowthKPIDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminKPIPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">داشبورد رشد وایب</h1>
        <p className="text-gray-500 mt-1">
          KPIهای رشد حول Engagement Loop — آیا وایب زنده است؟
        </p>
      </div>
      <GrowthKPIDashboard />
    </div>
  );
}
