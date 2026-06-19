'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GitMerge, Loader2, Pencil } from 'lucide-react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { catalogCategoryLabel } from '@/lib/catalog-display';
import { similarCatalogMatchLabel, type SimilarCatalogRow } from '@/lib/catalog-items';

type Props = {
  items: SimilarCatalogRow[];
  loading?: boolean;
  mergeLoading?: boolean;
  /** اگر ست شود، این آیتم همیشه مقصد ادغام است (پنل جزئیات) */
  fixedTargetId?: string | null;
  fixedTargetTitle?: string;
  onMerge: (targetId: string, sourceIds: string[]) => Promise<void>;
  emptyMessage?: string;
};

export default function CatalogSimilarMergePanel({
  items,
  loading = false,
  mergeLoading = false,
  fixedTargetId = null,
  fixedTargetTitle,
  onMerge,
  emptyMessage = 'مورد مشابهی یافت نشد',
}: Props) {
  const [mergeTargetId, setMergeTargetId] = useState('');

  useEffect(() => {
    if (fixedTargetId) return;
    setMergeTargetId(items[0]?.id ?? '');
  }, [items, fixedTargetId]);

  const displayItems = fixedTargetId ? items.filter((item) => item.id !== fixedTargetId) : items;
  const targetId = fixedTargetId ?? mergeTargetId;
  const targetTitle =
    fixedTargetTitle ??
    items.find((item) => item.id === mergeTargetId)?.title ??
    '';

  const handleMergeSources = async (sourceIds: string[]) => {
    if (!targetId || sourceIds.length === 0) return;
    if (
      !confirm(
        `ادغام ${sourceIds.length.toLocaleString('fa-IR')} مورد در «${targetTitle}»؟\nاین کار قابل بازگشت نیست.`
      )
    ) {
      return;
    }
    await onMerge(targetId, sourceIds);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const sourceIds = displayItems.map((item) => item.id).filter((id) => id !== targetId);

  return (
    <div className="space-y-3">
      {fixedTargetId && fixedTargetTitle && (
        <p className="rounded-xl border border-violet-300 bg-violet-50/60 px-3 py-2.5 text-xs font-semibold text-violet-900">
          مقصد ادغام: {fixedTargetTitle}
        </p>
      )}

      {!fixedTargetId && displayItems.length >= 2 && (
        <p className="text-xs text-gray-600">
          یکی را به‌عنوان <strong>مقصد</strong> انتخاب کنید؛ بقیه در آن ادغام می‌شوند.
        </p>
      )}

      <ul className="space-y-2" role={fixedTargetId ? undefined : 'radiogroup'}>
        {displayItems.map((item) => {
          const isTarget = !fixedTargetId && item.id === mergeTargetId;
          return (
            <li
              key={item.id}
              className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center ${
                isTarget ? 'border-violet-400 bg-violet-50/40' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {!fixedTargetId && displayItems.length >= 2 && (
                  <input
                    type="radio"
                    name="similar-merge-target"
                    checked={mergeTargetId === item.id}
                    onChange={() => setMergeTargetId(item.id)}
                    className="shrink-0 text-violet-600 focus:ring-violet-500"
                    aria-label={`مقصد: ${item.title}`}
                  />
                )}
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
                  <ImageWithFallback
                    src={item.imageUrl ?? ''}
                    alt=""
                    className="h-full w-full object-cover"
                    fallbackIcon="📋"
                    preferStoredImage
                    categorySlug={item.categorySlug}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                      {catalogCategoryLabel(item.categorySlug)}
                    </span>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                      {similarCatalogMatchLabel(item.matchReason)}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {item.listCount.toLocaleString('fa-IR')} لیست
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <Link
                  href={`/admin/catalog/${item.id}/edit`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  ویرایش
                </Link>
                {fixedTargetId && (
                  <button
                    type="button"
                    disabled={mergeLoading}
                    onClick={() => void handleMergeSources([item.id])}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {mergeLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <GitMerge className="h-3.5 w-3.5" />
                    )}
                    ادغام
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {!fixedTargetId && sourceIds.length > 0 && (
        <button
          type="button"
          disabled={mergeLoading || !targetId}
          onClick={() => void handleMergeSources(sourceIds)}
          className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {mergeLoading ? 'در حال ادغام…' : `ادغام ${sourceIds.length.toLocaleString('fa-IR')} مورد در مقصد`}
        </button>
      )}
    </div>
  );
}
