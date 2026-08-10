import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import CategoriesPageClient from './CategoriesPageClient';
import { getCachedCategoriesIntelligenceData } from '@/lib/admin/categories-intelligence-data';

function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-2xl bg-[var(--color-border-muted)]" />
      <div className="h-12 animate-pulse rounded-xl bg-[var(--color-border-muted)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 animate-pulse"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[var(--color-bg)] rounded-xl" />
              <div className="flex-1 h-5 bg-[var(--color-bg)] rounded w-2/3" />
            </div>
            <div className="space-y-2 mb-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 bg-[var(--color-bg)] rounded w-full" />
              ))}
            </div>
            <div className="h-10 bg-[var(--color-bg)] rounded-lg w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Static chrome outside Suspense — paints while data streams */
function CategoriesPageChrome() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          مدیریت دسته‌بندی‌ها
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
          ابزار تصمیم‌گیری — سلامت، رشد و قابلیت درآمدزایی
        </p>
      </div>
      <Link
        href="/admin/categories/new"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
      >
        <Plus className="w-4 h-4" />
        دسته‌بندی جدید
      </Link>
    </div>
  );
}

async function CategoriesContent() {
  const { pulse, categories } = await getCachedCategoriesIntelligenceData();
  return (
    <CategoriesPageClient
      pulse={pulse}
      categories={categories}
      hideChrome
    />
  );
}

export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <div className="space-y-6" dir="rtl">
      <CategoriesPageChrome />
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
