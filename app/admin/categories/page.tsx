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
      <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 px-3 py-3">
            <div className="size-11 rounded-xl bg-[var(--color-bg)]" />
            <div className="h-4 flex-1 rounded bg-[var(--color-bg)]" />
            <div className="h-11 w-16 rounded-lg bg-[var(--color-bg)]" />
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
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
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
