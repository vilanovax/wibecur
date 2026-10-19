'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import type { ListsViewMode } from '@/lib/lists-page-layout';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
export type SortOption = 'newest' | 'popular' | 'most_saved' | 'rising';
/** Browse-mode vibes stay in FilterState for URL/mode sync; mood vibes are Explore-only */
export type VibeFilter = 'trending' | 'saved' | 'sleep' | 'calm_movie' | 'cafe' | 'family' | 'comedy' | 'drama';
export type CreatorType = 'all' | 'top' | 'new' | 'viral';

export type FilterCategoryOption = {
  id: string;
  name: string;
  slug?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive?: boolean;
  order?: number | null;
};

export interface FilterState {
  categories: Set<string>;
  /** Owned by browse modes on Lists — sheet must not offer a second sort control */
  sortBy: SortOption;
  vibes: Set<VibeFilter>;
  creatorType: CreatorType;
  minItemCount: number;
  /**
   * Index into save-count thresholds [0,5,10,20,50] (1–5), not star ratings.
   * Kept as `minRating` for persisted filterState compatibility.
   */
  minRating: number;
}

/** saveCount floors for minRating levels 1–5 — UI must say ذخیره, never امتیاز */
export const MIN_SAVE_THRESHOLDS = [0, 5, 10, 20, 50] as const;

const CREATOR_OPTIONS: { value: CreatorType; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'top', label: 'کیوریتورهای برتر' },
  { value: 'new', label: 'تازه‌وارد' },
  { value: 'viral', label: 'وایرال شده' },
];

/** Catalog presets only — mood/vibe presets belong on Explore */
const PRESETS: { id: string; label: string; apply: (state: FilterState) => FilterState }[] = [
  {
    id: 'top',
    label: 'فقط پرذخیره (≥۲۰)',
    apply: (s) => ({ ...s, minRating: 4, creatorType: 'top' as CreatorType }),
  },
];

/** Browse-mode vibes (ترند/ذخیره) are not “active filters” — modes own them */
const BROWSE_MODE_VIBES = new Set<VibeFilter>(['trending', 'saved']);

function countAdvancedFilters(state: FilterState): number {
  const advancedVibes = [...state.vibes].filter((v) => !BROWSE_MODE_VIBES.has(v)).length;
  return (
    state.categories.size +
    advancedVibes +
    (state.creatorType !== 'all' ? 1 : 0) +
    (state.minItemCount > 0 ? 1 : 0) +
    (state.minRating > 0 ? 1 : 0)
  );
}

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-12 w-full items-center justify-between text-start"
      >
        <span className="wibe-body font-semibold text-foreground">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {open && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  );
}

interface FilterBottomSheetProProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FilterCategoryOption[];
  filterState: FilterState;
  getResultCount: (state: FilterState) => number;
  onApply: (state: FilterState) => void;
  viewMode?: ListsViewMode;
  onViewModeChange?: (mode: ListsViewMode) => void;
}

export default function FilterBottomSheetPro({
  isOpen,
  onClose,
  categories: cats,
  filterState,
  getResultCount,
  onApply,
  viewMode = 'grid',
  onViewModeChange,
}: FilterBottomSheetProProps) {
  const [localState, setLocalState] = useState<FilterState>(filterState);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    creator: false,
    itemCount: false,
    saves: false,
  });

  useEffect(() => {
    if (isOpen) setLocalState(filterState);
  }, [isOpen, filterState]);

  const resultCount = getResultCount(localState);

  const activeCount = countAdvancedFilters(localState);
  const canReset = activeCount > 0;

  const toggleSection = (key: string) => {
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleCategory = (id: string) => {
    setLocalState((s) => {
      const next = new Set(s.categories);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...s, categories: next };
    });
  };

  const handleReset = () => {
    // Keep browse-mode vibes/sort; clear only advanced filters + categories
    setLocalState((s) => ({
      ...s,
      categories: new Set(),
      vibes: new Set([...s.vibes].filter((v) => BROWSE_MODE_VIBES.has(v))),
      creatorType: 'all',
      minItemCount: 0,
      minRating: 0,
    }));
  };

  const handleApply = () => {
    onApply(localState);
    onClose();
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setLocalState(preset.apply(structuredClone(localState)));
  };

  const activeCategories = cats.filter((c) => c.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      side="bottom"
      title="فیلتر لیست‌ها"
      className="mx-auto max-w-2xl"
    >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="wibe-caption text-muted-foreground">
            {activeCount > 0 ? `${activeCount.toLocaleString('fa-IR')} فیلتر فعال` : 'بدون فیلتر'}
          </p>
          {canReset ? (
            <Button type="button" variant="ghost" className="h-11" onClick={handleReset}>
              پاک کردن
            </Button>
          ) : null}
        </div>

        {/* Live Result */}
        <div className="shrink-0 bg-brand/5 px-6 py-3">
          <p className="wibe-small font-medium text-foreground">
            {resultCount.toLocaleString('fa-IR')} لیست مطابق انتخاب شما
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {/* Presets */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="h-11 shrink-0 rounded-full bg-muted px-4 text-sm font-medium text-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>

          {onViewModeChange ? (
            <div className="mb-5 border-b border-border pb-5">
              <p className="mb-3 wibe-body font-semibold text-foreground">نمایش</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'border-brand bg-brand/10 font-semibold text-brand'
                      : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  گرید
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('compact')}
                  aria-pressed={viewMode === 'compact'}
                  className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors ${
                    viewMode === 'compact'
                      ? 'border-brand bg-brand/10 font-semibold text-brand'
                      : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  <List className="h-4 w-4" />
                  لیستی
                </button>
              </div>
            </div>
          ) : null}

          {/* Categories */}
          <AccordionSection
            title="دسته‌بندی"
            open={openSections.categories}
            onToggle={() => toggleSection('categories')}
          >
            <label className="flex items-center gap-3 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localState.categories.size === 0}
                onChange={() => setLocalState((s) => ({ ...s, categories: new Set() }))}
                className="size-5 rounded border-border text-brand"
              />
              <span className="wibe-small text-foreground">همه دسته‌ها</span>
            </label>
            {activeCategories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localState.categories.has(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="size-5 rounded border-border text-brand"
                />
                <span className="wibe-small text-foreground">{cat.icon} {cat.name}</span>
              </label>
            ))}
          </AccordionSection>

          {/* Sort lives on browse modes (ترند/جدید/محبوب) — no second control here */}

          {/* Creator Type */}
          <AccordionSection
            title="نوع سازنده"
            open={openSections.creator}
            onToggle={() => toggleSection('creator')}
          >
            <div className="flex flex-wrap gap-2">
              {CREATOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocalState((s) => ({ ...s, creatorType: opt.value }))}
                  className={`h-11 rounded-full px-4 text-sm font-medium ${
                    localState.creatorType === opt.value
                      ? 'border-2 border-brand bg-brand/10 font-semibold text-brand'
                      : 'border border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </AccordionSection>

          {/* Item Count Slider */}
          <AccordionSection
            title="تعداد آیتم"
            open={openSections.itemCount}
            onToggle={() => toggleSection('itemCount')}
          >
            <div className="space-y-3">
              <div className="flex justify-between wibe-small text-muted-foreground">
                <span>حداقل {localState.minItemCount.toLocaleString('fa-IR')} آیتم</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={localState.minItemCount}
                onChange={(e) =>
                  setLocalState((s) => ({ ...s, minItemCount: parseInt(e.target.value, 10) }))
                }
                className="h-2 w-full rounded-full bg-muted accent-brand"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>۰</span>
                <span>۱۰۰</span>
              </div>
            </div>
          </AccordionSection>

          {/* Min saves (not ratings) — thresholds match ListsPageClient.matchMinRating */}
          <AccordionSection
            title="حداقل ذخیره"
            open={openSections.saves}
            onToggle={() => toggleSection('saves')}
          >
            <p className="wibe-caption text-muted-foreground mb-3">
              بر اساس تعداد ذخیره‌ها — امتیاز ستاره‌ای نیست
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLocalState((s) => ({ ...s, minRating: 0 }))}
                className={`h-11 rounded-full border px-3 text-sm font-medium transition-colors ${
                  localState.minRating === 0
                    ? 'border-brand bg-brand/10 font-semibold text-brand'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                همه
              </button>
              {MIN_SAVE_THRESHOLDS.map((threshold, idx) => {
                const level = idx + 1;
                if (threshold === 0) return null;
                return (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() =>
                      setLocalState((s) => ({
                        ...s,
                        minRating: s.minRating === level ? 0 : level,
                      }))
                    }
                    aria-pressed={localState.minRating === level}
                    className={`h-11 rounded-full border px-3 text-sm font-medium tabular-nums transition-colors ${
                      localState.minRating === level
                        ? 'border-brand bg-brand/10 font-semibold text-brand'
                        : 'border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    ≥{threshold.toLocaleString('fa-IR')}
                  </button>
                );
              })}
            </div>
            <p className="wibe-caption text-muted-foreground mt-2">
              {localState.minRating > 0
                ? `حداقل ${(MIN_SAVE_THRESHOLDS[localState.minRating - 1] ?? 0).toLocaleString('fa-IR')} ذخیره`
                : 'بدون حد ذخیره'}
            </p>
          </AccordionSection>
        </div>

        {/* Sticky Bottom CTA */}
        <div className="mt-4 border-t border-border pt-4">
          <Button type="button" variant="brand" size="lg" className="w-full" onClick={handleApply}>
            اعمال فیلتر ({resultCount.toLocaleString('fa-IR')} نتیجه)
          </Button>
        </div>
    </Sheet>
  );
}
