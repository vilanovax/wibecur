import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';
import {
  CatalogNotReadyError,
  findDuplicateCatalogGroups,
  getCatalogCategoryFilters,
  isCatalogClientReady,
  listCatalogItems,
} from '@/lib/catalog-items';
import AdminDatabaseUnavailable from '@/components/admin/shared/AdminDatabaseUnavailable';
import CatalogPageClient from './CatalogPageClient';

export const metadata: Metadata = {
  title: 'آیتم‌ها | پنل ادمین',
  description: 'کاتالوگ مشترک و مدیریت آیتم‌ها',
};

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; tab?: string; category?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const q = params.q?.trim() || '';
  const tab = params.tab === 'duplicates' ? 'duplicates' : 'browse';
  const category = params.category?.trim() || '';

  if (!isCatalogClientReady(prisma)) {
    return (
      <div className="space-y-4" dir="rtl">
        <h1 className="text-xl font-bold">آیتم‌ها</h1>
        <AdminDatabaseUnavailable
          message="Prisma Client قدیمی است یا جدول catalog_items ساخته نشده."
          backHref="/admin/lists"
          backLabel="بازگشت به لیست‌ها"
        />
        <pre className="text-xs bg-gray-100 p-4 rounded-xl overflow-x-auto">
          npm run db:push{'\n'}npx prisma generate{'\n'}npm run dev
        </pre>
      </div>
    );
  }

  try {
    const [{ rows, total, totalPages }, duplicateGroups, categoryFilters, lists] =
      await dbQuery(() =>
        Promise.all([
          listCatalogItems(prisma, {
            page,
            perPage: 24,
            q: q || undefined,
            categorySlug: category || undefined,
          }).then((r) => ({
            ...r,
            totalPages: Math.ceil(r.total / 24) || 1,
          })),
          tab === 'duplicates'
            ? findDuplicateCatalogGroups(prisma, { limit: 50 })
            : Promise.resolve([]),
          getCatalogCategoryFilters(prisma),
          prisma.lists.findMany({
            where: { isActive: true },
            include: { categories: { select: { icon: true } } },
            orderBy: { title: 'asc' },
          }).then((rows) =>
            rows.map((l) => ({
              id: l.id,
              title: l.title,
              icon: l.categories?.icon ?? null,
            }))
          ),
        ])
      );

    return (
      <CatalogPageClient
      initialTab={tab}
      initialRows={rows}
      initialTotal={total}
      initialPage={page}
      initialTotalPages={totalPages}
      initialQuery={q}
      initialCategory={category}
      initialCategoryFilters={categoryFilters}
      initialDuplicateGroups={duplicateGroups}
      lists={lists}
    />
    );
  } catch (error) {
    if (error instanceof CatalogNotReadyError) {
      return (
        <div className="space-y-4" dir="rtl">
          <h1 className="text-xl font-bold">آیتم‌ها</h1>
          <AdminDatabaseUnavailable
            message={error.message}
            backHref="/admin/lists"
            backLabel="بازگشت به لیست‌ها"
          />
        </div>
      );
    }
    throw error;
  }
}
