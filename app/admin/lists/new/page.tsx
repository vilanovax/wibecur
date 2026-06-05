import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { isDatabaseConnectionError, databaseErrorMessage } from '@/lib/admin/is-database-error';
import AdminDatabaseUnavailable from '@/components/admin/shared/AdminDatabaseUnavailable';
import NewListForm from './NewListForm';

export default async function NewListPage() {
  await requireAdmin();

  try {
    const categories = await prisma.categories.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    return (
      <div>
        <NewListForm categories={categories} />
      </div>
    );
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;

    return (
      <div className="space-y-4" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">لیست جدید</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">ایجاد لیست جدید در پلتفرم</p>
        </div>
        <AdminDatabaseUnavailable
          message={databaseErrorMessage(error)}
          backHref="/admin/lists"
          backLabel="بازگشت به لیست‌ها"
        />
      </div>
    );
  }
}
