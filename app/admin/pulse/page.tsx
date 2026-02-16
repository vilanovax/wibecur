import { requireAdmin } from '@/lib/auth';
import PulseDashboardClient from './PulseDashboardClient';

export const dynamic = 'force-dynamic';

export default async function PulseDashboardPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PulseDashboardClient />
    </div>
  );
}
