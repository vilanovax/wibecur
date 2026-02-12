import { requireAdmin } from '@/lib/auth';
import PulseDashboardClient from './PulseDashboardClient';

export const dynamic = 'force-dynamic';

export default async function PulseDashboardPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-6 text-white shadow-xl">
        <h1 className="text-2xl font-bold mb-1">مرکز کنترل وایب</h1>
        <p className="text-gray-300 text-sm">
          ضربان لحظه‌ای فعالیت، رشد و تعامل
        </p>
      </div>
      <PulseDashboardClient />
    </div>
  );
}
