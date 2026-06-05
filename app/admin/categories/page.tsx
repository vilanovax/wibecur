import { requireAdmin } from '@/lib/auth';
import { Suspense } from 'react';
import CategoriesPageClient from './CategoriesPageClient';
import { getCachedCategoriesIntelligenceData } from '@/lib/admin/categories-intelligence-data';

function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
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
  );
}

async function CategoriesContent() {
  const { pulse, categories } = await getCachedCategoriesIntelligenceData();
  return <CategoriesPageClient pulse={pulse} categories={categories} />;
}

export default async function CategoriesPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
