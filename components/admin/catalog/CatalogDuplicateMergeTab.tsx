'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  GitMerge,
  Loader2,
  Pencil,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import CatalogSimilarMergePanel from '@/components/admin/catalog/CatalogSimilarMergePanel';
import { catalogCategoryLabel, formatExternalKeyHint } from '@/lib/catalog-display';
import {
  pickSuggestedMergeTarget,
  type DuplicateCatalogGroup,
  type SimilarCatalogRow,
} from '@/lib/catalog-items';

type Props = {
  groups: DuplicateCatalogGroup[];
  loading: boolean;
  mergeLoadingKey: string | null;
  mergeTarget: Record<string, string>;
  onMergeTargetChange: (groupKey: string, catalogId: string) => void;
  onMergeGroup: (group: DuplicateCatalogGroup) => void;
  similarQuery: string;
  onSimilarQueryChange: (value: string) => void;
  onSimilarSearch: () => void;
  similarItems: SimilarCatalogRow[];
  similarLoading: boolean;
  similarMergeLoading: boolean;
  onSimilarMerge: (targetId: string, sourceIds: string[]) => Promise<void>;
};

function DuplicateGroupCard({
  group,
  targetId,
  mergeLoading,
  onTargetChange,
  onMerge,
}: {
  group: DuplicateCatalogGroup;
  targetId: string;
  mergeLoading: boolean;
  onTargetChange: (catalogId: string) => void;
  onMerge: () => void;
}) {
  const target = group.catalogs.find((c) => c.id === targetId) ?? group.catalogs[0];
  const sources = group.catalogs.filter((c) => c.id !== targetId);
  const extHint = target ? formatExternalKeyHint(target.externalKey) : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-amber-200/90 bg-white shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-100 bg-gradient-to-l from-amber-50/90 to-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
              {group.catalogs.length.toLocaleString('fa-IR')} تکرار
            </span>
            {group.categorySlug && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                {catalogCategoryLabel(group.categorySlug)}
              </span>
            )}
          </div>
          <p className="truncate text-sm font-bold text-gray-900" title={group.normalizedTitle}>
            {group.normalizedTitle}
          </p>
          {target && sources.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {sources.length.toLocaleString('fa-IR')} مورد در «{target.title}» ادغام می‌شود
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={mergeLoading || !targetId || sources.length === 0}
          onClick={onMerge}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {mergeLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitMerge className="h-4 w-4" />
          )}
          ادغام
        </button>
      </header>

      <ul className="divide-y divide-gray-100 p-2" role="radiogroup" aria-label="انتخاب مقصد ادغام">
        {group.catalogs.map((catalog, index) => {
          const isTarget = catalog.id === targetId;
          const isSuggested = index === 0 && catalog.id === pickSuggestedMergeTarget(group.catalogs);
          const rowExt = formatExternalKeyHint(catalog.externalKey);

          return (
            <li key={catalog.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors ${
                  isTarget
                    ? 'bg-violet-50 ring-1 ring-violet-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`merge-${group.groupKey}`}
                  checked={isTarget}
                  onChange={() => onTargetChange(catalog.id)}
                  className="shrink-0 text-violet-600 focus:ring-violet-500"
                />
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
                  <ImageWithFallback
                    src={catalog.imageUrl ?? ''}
                    alt=""
                    className="h-full w-full object-cover"
                    fallbackIcon="📋"
                    preferStoredImage
                    categorySlug={group.categorySlug}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-gray-900">{catalog.title}</p>
                    {isTarget && (
                      <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        مقصد
                      </span>
                    )}
                    {!isTarget && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        <Trash2 className="h-2.5 w-2.5" />
                        حذف
                      </span>
                    )}
                    {isSuggested && isTarget && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <Sparkles className="h-2.5 w-2.5" />
                        پیشنهادی
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    <span>{catalog.listCount.toLocaleString('fa-IR')} لیست</span>
                    {rowExt && <span className="truncate text-violet-600/80">{rowExt}</span>}
                  </div>
                </div>
                <Link
                  href={`/admin/catalog/${catalog.id}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-white"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  ویرایش
                </Link>
              </label>
            </li>
          );
        })}
      </ul>

      {extHint && (
        <footer className="border-t border-gray-100 bg-gray-50/80 px-4 py-2 text-[11px] text-gray-500">
          شناسه مقصد: {extHint}
        </footer>
      )}
    </article>
  );
}

export default function CatalogDuplicateMergeTab({
  groups,
  loading,
  mergeLoadingKey,
  mergeTarget,
  onMergeTargetChange,
  onMergeGroup,
  similarQuery,
  onSimilarQueryChange,
  onSimilarSearch,
  similarItems,
  similarLoading,
  similarMergeLoading,
  onSimilarMerge,
}: Props) {
  const [manualSearchOpen, setManualSearchOpen] = useState(false);

  const duplicateEntryCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.catalogs.length, 0),
    [groups]
  );

  return (
    <div className="space-y-5">
      {/* جستجوی دستی — جمع‌شونده */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setManualSearchOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right hover:bg-gray-50/80"
        >
          <div>
            <h3 className="text-sm font-bold text-gray-900">جستجوی دستی مشابه</h3>
            <p className="text-xs text-gray-500 mt-0.5">عنوان، IMDb، ISBN — برای ادغام دستی</p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
              manualSearchOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {manualSearchOpen && (
          <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3">
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                onSimilarSearch();
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={similarQuery}
                  onChange={(e) => onSimilarQueryChange(e.target.value)}
                  placeholder="Fight Club، tt0137523، جان ویک…"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={similarLoading || similarQuery.trim().length < 2}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {similarLoading ? '…' : 'جستجو'}
              </button>
            </form>
            {(similarLoading || similarItems.length > 0 || similarQuery.trim().length >= 2) && (
              <CatalogSimilarMergePanel
                items={similarItems}
                loading={similarLoading}
                mergeLoading={similarMergeLoading}
                onMerge={onSimilarMerge}
                emptyMessage="مورد مشابهی برای این عبارت یافت نشد"
              />
            )}
          </div>
        )}
      </section>

      {/* تکرارهای خودکار */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">تکرارهای خودکار</h3>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-600">
              گروه‌های با عنوان یکسان. مقصد پیشنهادی = بیشترین جایگاه در لیست. موارد «حذف» بعد از
              ادغام از کاتالوگ پاک می‌شوند.
            </p>
          </div>
          {groups.length > 0 && (
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                {groups.length.toLocaleString('fa-IR')} گروه
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                {duplicateEntryCount.toLocaleString('fa-IR')} مورد
              </span>
            </div>
          )}
        </div>

        {loading && groups.length === 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 py-12 text-center">
            <p className="font-medium text-emerald-800">تکرار احتمالی یافت نشد</p>
            <p className="mt-1 text-xs text-emerald-700/80">کاتالوگ تمیز است</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {groups.map((group) => {
              const targetId =
                mergeTarget[group.groupKey] ?? pickSuggestedMergeTarget(group.catalogs);
              return (
                <DuplicateGroupCard
                  key={group.groupKey}
                  group={group}
                  targetId={targetId}
                  mergeLoading={mergeLoadingKey === group.groupKey}
                  onTargetChange={(id) => onMergeTargetChange(group.groupKey, id)}
                  onMerge={() => onMergeGroup(group)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
