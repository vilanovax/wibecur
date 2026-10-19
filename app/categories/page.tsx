import Link from 'next/link';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import CategoryNavStrip from '@/components/shared/CategoryNavStrip';
import PageBreadcrumb from '@/components/shared/PageBreadcrumb';
import JsonLdBreadcrumb from '@/components/shared/JsonLdBreadcrumb';
import {
  fetchActiveCategoryIndex,
  fetchActiveCategoryMenu,
  type CategoryMenuChip,
} from '@/lib/category-menu';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export const revalidate = 3600;

export const metadata = {
  title: 'دسته‌ها | WibeCur',
  description: 'مرور دسته‌بندی‌های لیست‌های کیوریت‌شده',
};

function isDbError(e: unknown): boolean {
  const err = e as Error & { code?: string };
  const msg = String(err?.message ?? '');
  return (
    err?.code === 'P1001' ||
    msg.includes("Can't reach database") ||
    msg.includes('Invalid value undefined for datasource') ||
    msg.includes('PrismaClient')
  );
}

export default async function CategoriesIndexPage() {
  let categories: {
    id: string;
    name: string;
    slug: string | null;
    icon: string | null;
    color: string | null;
  }[] = [];

  let menuCategories: CategoryMenuChip[] = [];
  try {
    // دسته‌ها و منو مستقل‌اند — موازی + Data Cache (async-parallel / server-cache).
    const [categoryRows, menuRows] = await Promise.all([
      fetchActiveCategoryIndex(),
      fetchActiveCategoryMenu(),
    ]);
    categories = categoryRows;
    menuCategories = menuRows;
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      console.warn('Categories index: DB unavailable:', (e as Error)?.message);
    } else {
      throw e;
    }
  }

  const breadcrumbItems = [
    { label: 'خانه', href: '/' },
    { label: 'دسته‌ها' },
  ];

  return (
    <div className="bg-background">
      <JsonLdBreadcrumb
        items={[
          { name: 'خانه', path: '/' },
          { name: 'دسته‌ها', path: '/categories' },
        ]}
      />
      <Header title="دسته‌ها" showBack />
      <CategoryNavStrip initialCategories={menuCategories} />
      <main className="px-2.5 pt-3">
        <PageBreadcrumb className="mb-3 px-1.5" items={breadcrumbItems} />
        <p className="mb-4 text-sm text-muted-foreground">
          بر اساس موضوع، لیست‌های کیوریت‌شده را پیدا کن
        </p>

        {categories.length === 0 ? (
          <EmptyState
            title="دسته‌ای یافت نشد"
            description="هنوز دسته‌ای برای مرور نیست."
            action={
              <Link
                href="/lists"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-brand-foreground"
              >
                رفتن به لیست‌ها
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.slug ?? cat.id}`} className="block">
                <Card className="flex min-h-24 flex-col items-center justify-center gap-2 bg-popover p-4">
                  <span className="text-3xl leading-none" aria-hidden>
                    {cat.icon ?? '📁'}
                  </span>
                  <span className="line-clamp-2 text-center text-sm font-semibold text-foreground">
                    {cat.name}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
