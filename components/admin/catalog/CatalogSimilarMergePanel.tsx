'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());

  const displayItems = useMemo(
    () => (fixedTargetId ? items.filter((item) => item.id !== fixedTargetId) : items),
    [items, fixedTargetId]
  );

  const targetId = fixedTargetId ?? mergeTargetId;

  useEffect(() => {
    if (fixedTargetId) return;
    setMergeTargetId(items[0]?.id ?? '');
  }, [items, fixedTargetId]);

  // پیش‌فرض خالی — فقط موارد تیک‌خورده ادغام می‌شوند
  useEffect(() => {
    setSelectedSourceIds(new Set());
  }, [displayItems, targetId]);

  const targetTitle =
    fixedTargetTitle ??
    items.find((item) => item.id === mergeTargetId)?.title ??
    '';

  const sourceIds = [...selectedSourceIds].filter((id) => id !== targetId);

  const toggleSource = (id: string) => {
    if (id === targetId) return;
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMergeSources = async (ids: string[]) => {
    if (!targetId || ids.length === 0) return;
    if (
      !confirm(
        `ادغام ${ids.length.toLocaleString('fa-IR')} مورد در «${targetTitle}»؟\nاین کار قابل بازگشت نیست.`
      )
    ) {
      return;
    }
    await onMerge(targetId, ids);
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
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-wibe-secondary">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fixedTargetId && fixedTargetTitle && (
        <p className="rounded-xl border border-violet-300 bg-violet-50/60 px-3 py-2.5 text-xs font-semibold text-violet-900">
          مقصد ادغام: {fixedTargetTitle}
        </p>
      )}

      {!fixedTargetId && displayItems.length >= 2 && (
        <p className="text-xs text-wibe-secondary">
          مقصد را با رادیو انتخاب کنید و با چک‌باکس مشخص کنید کدام موارد ادغام شوند. موارد بدون تیک
          کنار گذاشته می‌شوند.
        </p>
      )}

      {fixedTargetId && (
        <p className="text-xs text-wibe-secondary">
          فقط موارد تیک‌خورده در مقصد ادغام می‌شوند.
        </p>
      )}

      {displayItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-lg border border-(--color-border) px-3 text-xs text-wibe-secondary hover:bg-(--color-bg)"
            onClick={() =>
              setSelectedSourceIds(
                new Set(displayItems.map((item) => item.id).filter((id) => id !== targetId))
              )
            }
          >
            انتخاب همه
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-(--color-border) px-3 text-xs text-wibe-secondary hover:bg-(--color-bg)"
            onClick={() => setSelectedSourceIds(new Set())}
          >
            هیچ‌کدام
          </button>
        </div>
      )}

      <ul className="space-y-2" role={fixedTargetId ? undefined : 'radiogroup'}>
        {displayItems.map((item) => {
          const isTarget = !fixedTargetId && item.id === mergeTargetId;
          const isSelectedSource = selectedSourceIds.has(item.id) && item.id !== targetId;
          return (
            <li
              key={item.id}
              className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center ${
                isTarget
                  ? 'border-violet-400 bg-violet-50/40'
                  : isSelectedSource
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-gray-200 bg-white opacity-70'
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
                {item.id !== targetId && (
                  <input
                    type="checkbox"
                    checked={isSelectedSource}
                    onChange={() => toggleSource(item.id)}
                    className="shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    aria-label={`ادغام ${item.title}`}
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
                  <p className="truncate text-sm font-bold text-(--color-text)">{item.title}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-(--color-text-subtle)" dir="ltr">
                    {item.id}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-wibe-secondary">
                      {catalogCategoryLabel(item.categorySlug)}
                    </span>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                      {similarCatalogMatchLabel(item.matchReason)}
                    </span>
                    <span className="text-[10px] text-wibe-secondary">
                      {item.listCount.toLocaleString('fa-IR')} لیست
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <Link
                  href={`/admin/catalog/${item.id}/edit`}
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-(--color-text) hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  ویرایش
                </Link>
                {fixedTargetId && item.id !== targetId && (
                  <button
                    type="button"
                    disabled={mergeLoading || !isSelectedSource}
                    onClick={() => void handleMergeSources([item.id])}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
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

      {sourceIds.length > 0 && (
        <button
          type="button"
          disabled={mergeLoading || !targetId}
          onClick={() => void handleMergeSources(sourceIds)}
          className="w-full min-h-11 rounded-xl bg-violet-600 py-2.5 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {mergeLoading
            ? 'در حال ادغام…'
            : `ادغام ${sourceIds.length.toLocaleString('fa-IR')} مورد انتخاب‌شده در مقصد`}
        </button>
      )}
    </div>
  );
}
