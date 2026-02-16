import { requireAdmin } from '@/lib/auth';
import AuditLogClient from '@/components/admin/audit/AuditLogClient';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">لاگ تغییرات (Audit)</h1>
      <AuditLogClient />
    </div>
  );
}
