'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
  GripVertical,
} from 'lucide-react';
import BottomSheet from '@/components/mobile/shared/BottomSheet';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import Toast from '@/components/shared/Toast';
import { dispatchProfilePicksUpdated } from '@/lib/profile-events';
import type { ProfilePickItemDto, ProfilePicksResponse } from '@/lib/profile-picks-types';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface BrowseItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  catalogItemId: string | null;
  lists: {
    categories: Category | null;
  };
}

interface ProfilePicksEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialCategorySlug?: string;
  maxPerCategory: number;
  onUpdated?: () => void;
}

const CHIP_BASE =
  'flex items-center gap-1.5 h-9 px-3 rounded-full wibe-caption font-medium whitespace-nowrap flex-shrink-0 transition-[colors,transform] active:scale-[0.98]';

function categoryChipClass(isSelected: boolean) {
  return isSelected
    ? `${CHIP_BASE} bg-primary text-white shadow-sm`
    : `${CHIP_BASE} bg-wibe-surface border border-wibe text-foreground hover:border-primary/30`;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

async function fetchBrowsePage(categorySlug: string, page: number, search: string) {
  const qs = new URLSearchParams({ category: categorySlug, page: String(page), limit: '24' });
  if (search) qs.set('q', search);
  const res = await fetch(`/api/user/profile-picks/browse-items?${qs}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'خطا');
  return data.data as {
    items: BrowseItem[];
    pagination: { hasMore: boolean; page: number };
  };
}

function PickEditorCard({
  pick,
  idx,
  total,
  busyId,
  editingNoteId,
  noteDraft,
  onNoteDraftChange,
  onStartEditNote,
  onCancelNote,
  onSaveNote,
  onRemove,
  onReorder,
}: {
  pick: ProfilePickItemDto;
  idx: number;
  total: number;
  busyId: string | null;
  editingNoteId: string | null;
  noteDraft: string;
  onNoteDraftChange: (v: string) => void;
  onStartEditNote: () => void;
  onCancelNote: () => void;
  onSaveNote: () => void;
  onRemove: () => void;
  onReorder: (dir: 'up' | 'down') => void;
}) {
  const isBusy = busyId === pick.id;

  return (
    <div className="flex shrink-0 flex-col w-[92px]">
      <div className="group relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
        {pick.imageUrl ? (
          <ImageWithFallback
            src={pick.imageUrl}
            alt={pick.title}
            className="h-full w-full object-cover"
            fallbackIcon="✨"
            fallbackClassName="flex h-full w-full items-center justify-center bg-gray-200"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xl">✨</div>
        )}
        <span className="absolute start-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 wibe-caption font-bold text-white">
          {(idx + 1).toLocaleString('fa-IR')}
        </span>
        <button
          type="button"
          disabled={isBusy}
          onClick={onRemove}
          className="absolute end-1.5 top-1.5 rounded-full bg-red-500/90 p-1 text-white opacity-0 shadow transition-opacity group-hover:opacity-100 disabled:opacity-50"
          aria-label="حذف"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <p className="mt-1 line-clamp-2 text-start wibe-caption font-medium leading-tight">
        {pick.title}
      </p>
      {editingNoteId === pick.id ? (
        <div className="mt-1 space-y-1">
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => onNoteDraftChange(e.target.value)}
            maxLength={120}
            placeholder="یادداشت..."
            className="w-full rounded-md border border-wibe px-1.5 py-1 wibe-caption outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={onSaveNote}
              disabled={isBusy}
              className="flex-1 rounded bg-primary py-0.5 wibe-caption text-white"
            >
              ذخیره
            </button>
            <button
              type="button"
              onClick={onCancelNote}
              className="px-1 wibe-caption text-wibe-secondary"
            >
              ×
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onStartEditNote}
          className="mt-0.5 line-clamp-1 w-full text-start wibe-caption text-primary/80 hover:text-primary"
        >
          {pick.note || '+ یادداشت'}
        </button>
      )}
      <div className="mt-1 flex justify-center gap-0.5">
        <button
          type="button"
          disabled={idx === 0 || isBusy}
          onClick={() => onReorder('up')}
          className="rounded p-0.5 text-wibe-secondary hover:bg-gray-100 disabled:opacity-25"
          aria-label="جابجایی به چپ"
        >
          <ChevronUp className="h-3.5 w-3.5 rotate-90" />
        </button>
        <GripVertical className="h-3.5 w-3.5 text-wibe-secondary/40" aria-hidden />
        <button
          type="button"
          disabled={idx >= total - 1 || isBusy}
          onClick={() => onReorder('down')}
          className="rounded p-0.5 text-wibe-secondary hover:bg-gray-100 disabled:opacity-25"
          aria-label="جابجایی به راست"
        >
          <ChevronDown className="h-3.5 w-3.5 rotate-90" />
        </button>
      </div>
    </div>
  );
}

export default function ProfilePicksEditorSheet({
  isOpen,
  onClose,
  categories,
  initialCategorySlug,
  maxPerCategory,
  onUpdated,
}: ProfilePicksEditorSheetProps) {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState(
    initialCategorySlug ?? categories[0]?.slug ?? ''
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data: picksData, refetch: refetchPicks } = useQuery({
    queryKey: ['profile-picks-editor'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile-picks');
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as ProfilePicksResponse;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialCategorySlug) setActiveCategory(initialCategorySlug);
    else if (categories[0]?.slug) setActiveCategory(categories[0].slug);
    setSearch('');
    setEditingNoteId(null);
  }, [initialCategorySlug, categories, isOpen]);

  const activeCat = categories.find((c) => c.slug === activeCategory);

  const pickCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const shelf of picksData?.shelves ?? []) {
      map.set(shelf.categorySlug, shelf.picks.length);
    }
    return map;
  }, [picksData]);

  const shelfPicks = useMemo(() => {
    const shelf = picksData?.shelves.find((s) => s.categorySlug === activeCategory);
    return shelf?.picks ?? [];
  }, [picksData, activeCategory]);

  const canAddMore = shelfPicks.length < maxPerCategory;
  const fillPercent = Math.round((shelfPicks.length / maxPerCategory) * 100);

  const {
    data: browseData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: browseLoading,
  } = useInfiniteQuery({
    queryKey: ['profile-picks-browse', activeCategory, debouncedSearch],
    queryFn: ({ pageParam }) => fetchBrowsePage(activeCategory, pageParam, debouncedSearch),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasMore ? last.pagination.page + 1 : undefined,
    enabled: isOpen && canAddMore && !!activeCategory,
  });

  const browseItems = browseData?.pages.flatMap((p) => p.items) ?? [];

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, browseItems.length]);

  const invalidate = useCallback(() => {
    void refetchPicks();
    void queryClient.invalidateQueries({ queryKey: ['user'] });
    dispatchProfilePicksUpdated();
    onUpdated?.();
  }, [refetchPicks, queryClient, onUpdated]);

  const handleAdd = async (catalogItemId: string) => {
    if (!catalogItemId) return;
    setBusyId(catalogItemId);
    try {
      const res = await fetch('/api/user/profile-picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catalogItemId }),
      });
      const json = await res.json();
      if (!json.success) {
        setToast({ message: json.error || 'خطا', type: 'error' });
        return;
      }
      setToast({ message: 'اضافه شد', type: 'success' });
      setSearch('');
      invalidate();
    } catch {
      setToast({ message: 'خطا در افزودن', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (pickId: string) => {
    setBusyId(pickId);
    try {
      const res = await fetch(`/api/user/profile-picks/${pickId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        setToast({ message: json.error || 'خطا', type: 'error' });
        return;
      }
      invalidate();
    } catch {
      setToast({ message: 'خطا در حذف', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleReorder = async (pickId: string, direction: 'up' | 'down') => {
    const ids = shelfPicks.map((p) => p.id);
    const idx = ids.indexOf(pickId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];

    setBusyId(pickId);
    try {
      const res = await fetch('/api/user/profile-picks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorySlug: activeCategory, orderedIds: ids }),
      });
      const json = await res.json();
      if (!json.success) {
        setToast({ message: json.error || 'خطا', type: 'error' });
        return;
      }
      invalidate();
    } catch {
      setToast({ message: 'خطا در مرتب‌سازی', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const saveNote = async (pickId: string) => {
    setBusyId(pickId);
    try {
      const res = await fetch(`/api/user/profile-picks/${pickId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteDraft }),
      });
      const json = await res.json();
      if (!json.success) {
        setToast({ message: json.error || 'خطا', type: 'error' });
        return;
      }
      setEditingNoteId(null);
      invalidate();
    } catch {
      setToast({ message: 'خطا در ذخیره یادداشت', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="ویرایش منتخب‌ها"
        desktopMaxWidth="lg"
      >
        <div className="space-y-4 pb-2" dir="rtl">
          {/* Category tabs with counts */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {categories.map((cat) => {
              const count = pickCountByCategory.get(cat.slug) ?? 0;
              const selected = activeCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    setSearch('');
                    setEditingNoteId(null);
                  }}
                  className={categoryChipClass(selected)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 wibe-caption font-bold leading-none ${
                        selected ? 'bg-white/25 text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {count.toLocaleString('fa-IR')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeCat && (
            <div className="rounded-xl bg-wibe-surface px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="wibe-small font-medium text-foreground">
                  {activeCat.icon} {activeCat.name}
                </p>
                <span className="wibe-caption font-semibold text-primary">
                  {shelfPicks.length.toLocaleString('fa-IR')} /{' '}
                  {maxPerCategory.toLocaleString('fa-IR')}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary transition-colors duration-300"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Current picks — horizontal scroll */}
          {shelfPicks.length > 0 ? (
            <div>
              <p className="mb-2 wibe-caption font-medium text-wibe-secondary">
                منتخب‌های فعلی — برای حذف روی پوستر hover کن
              </p>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide" dir="ltr">
                <div className="flex gap-2.5" style={{ direction: 'rtl' }}>
                  {shelfPicks.map((pick, idx) => (
                    <PickEditorCard
                      key={pick.id}
                      pick={pick}
                      idx={idx}
                      total={shelfPicks.length}
                      busyId={busyId}
                      editingNoteId={editingNoteId}
                      noteDraft={noteDraft}
                      onNoteDraftChange={setNoteDraft}
                      onStartEditNote={() => {
                        setEditingNoteId(pick.id);
                        setNoteDraft(pick.note ?? '');
                      }}
                      onCancelNote={() => setEditingNoteId(null)}
                      onSaveNote={() => saveNote(pick.id)}
                      onRemove={() => handleRemove(pick.id)}
                      onReorder={(dir) => handleReorder(pick.id, dir)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-wibe py-6 text-center">
              <p className="wibe-small text-wibe-secondary">
                هنوز {activeCat?.name ?? 'آیتمی'} انتخاب نکردی
              </p>
            </div>
          )}

          {/* Search — always visible when slots remain */}
          {canAddMore && (
            <div className="rounded-xl border border-wibe bg-wibe-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="wibe-small font-semibold text-foreground">
                  {shelfPicks.length === 0 ? 'انتخاب آیتم' : 'افزودن آیتم'}
                </p>
                <span className="wibe-caption text-wibe-secondary">
                  {maxPerCategory - shelfPicks.length} جای خالی
                </span>
              </div>
              <div className="relative mb-3">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wibe-secondary" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`جستجو در ${activeCat?.name ?? 'دسته'}...`}
                  className="w-full rounded-xl border border-wibe bg-wibe-surface py-2.5 pe-3 ps-9 wibe-small outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
                />
              </div>

              {browseLoading && browseItems.length === 0 ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : browseItems.length === 0 ? (
                <p className="py-4 text-center wibe-caption text-wibe-secondary">
                  {search ? 'نتیجه‌ای یافت نشد' : 'برای جستجو تایپ کن'}
                </p>
              ) : (
                <ul className="max-h-[220px] space-y-1.5 overflow-y-auto overscroll-contain">
                  {browseItems.map((item) => {
                    const cid = item.catalogItemId;
                    if (!cid) return null;
                    const isBusy = busyId === cid;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAdd(cid)}
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-start transition-colors hover:border-primary/20 hover:bg-primary/5 disabled:opacity-50"
                        >
                          <div className="h-11 w-8 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
                            {item.imageUrl ? (
                              <ImageWithFallback
                                src={item.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                fallbackIcon="✨"
                                fallbackClassName="flex h-full w-full items-center justify-center text-xs"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs">✨</div>
                            )}
                          </div>
                          <span className="line-clamp-2 flex-1 wibe-small font-medium">
                            {item.title}
                          </span>
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                          ) : (
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Plus className="h-4 w-4" />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                  <div ref={loadMoreRef} className="h-2" />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </ul>
              )}
            </div>
          )}

          {!canAddMore && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center wibe-caption font-medium text-emerald-700">
              ✓ این قفسه پر است ({maxPerCategory.toLocaleString('fa-IR')} /{' '}
              {maxPerCategory.toLocaleString('fa-IR')})
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 wibe-small font-semibold text-white shadow-sm active:scale-[0.99]"
          >
            <Check className="h-4 w-4" />
            تمام
          </button>
        </div>
      </BottomSheet>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
