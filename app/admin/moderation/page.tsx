import { requireAdmin } from '@/lib/auth';
import ModerationQueueClient from '@/components/admin/moderation/ModerationQueueClient';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">صف بررسی</h1>
      <ModerationQueueClient />
    </div>
  );
}
