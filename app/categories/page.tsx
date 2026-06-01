import Link from 'next/link';
import Header from '@/components/mobile/layout/Header';
import BottomNav from '@/components/mobile/layout/BottomNav';
import { prisma } from '@/lib/prisma';
import { dbQuery } from '@/lib/db';

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

  try {
    categories = await dbQuery(() =>
      prisma.categories.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, icon: true, color: true },
        orderBy: { order: 'asc' },
      })
    );
  } catch (e) {
    if (isDbError(e) || process.env.NODE_ENV === 'development') {
      console.warn('Categories index: DB unavailable:', (e as Error)?.message);
    } else {
      throw e;
    }
  }

  return (
    <div className="min-h-screen bg-wibe-surface pb-20">
      <Header title="دسته‌ها" showBack />
      <main className="px-2.5 pt-3">
        <p className="mb-4 wibe-small text-wibe-secondary">
          بر اساس موضوع، لیست‌های کیوریت‌شده را پیدا کن
        </p>

        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-wibe py-12 text-center">
            <p className="wibe-body text-wibe-secondary">دسته‌ای یافت نشد</p>
            <Link href="/lists" className="mt-3 inline-block wibe-small font-semibold text-primary">
              رفتن به لیست‌ها
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug ?? cat.id}`}
                className="flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-xl border border-wibe bg-wibe-card p-4 shadow-sm transition-transform active:scale-[0.98]"
              >
                <span className="text-3xl leading-none" aria-hidden>
                  {cat.icon ?? '📁'}
                </span>
                <span className="line-clamp-2 text-center wibe-small font-semibold text-foreground">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
