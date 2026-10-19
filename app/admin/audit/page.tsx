import { requireAdmin } from '@/lib/auth';
import AuditLogClient from '@/components/admin/audit/AuditLogClient';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
  await requireAdmin();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text)] dark:text-white">لاگ تغییرات</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          تاریخچه عملیات حساس ادمین — کلیک روی هر ردیف برای مشاهده جزئیات
        </p>
      </div>
      <AuditLogClient />
    </div>
  );
}
