'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, Star, LayoutGrid, List } from 'lucide-react';
import type { ListsViewMode } from '@/lib/lists-page-layout';
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
  sortBy: SortOption;
  vibes: Set<VibeFilter>;
  creatorType: CreatorType;
  minItemCount: number;
  minRating: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'popular', label: 'محبوب‌ترین' },
  { value: 'most_saved', label: 'بیشترین ذخیره' },
  { value: 'rising', label: 'در حال رشد' },
];

const CREATOR_OPTIONS: { value: CreatorType; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'top', label: '⭐ کیوریتورهای برتر' },
  { value: 'new', label: '🆕 تازه‌وارد' },
  { value: 'viral', label: '🔥 وایرال شده' },
];

/** Catalog presets only — mood/vibe presets belong on Explore */
const PRESETS: { id: string; label: string; apply: (state: FilterState) => FilterState }[] = [
  {
    id: 'top',
    label: '⭐ فقط برترین‌ها',
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
    <div className="border-b border-wibe">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-right"
      >
        <span className="wibe-body font-semibold text-foreground">{title}</span>
        {open ? <ChevronUp className="w-5 h-5 text-wibe-secondary" /> : <ChevronDown className="w-5 h-5 text-wibe-secondary" />}
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
    sort: false,
    creator: false,
    itemCount: false,
    rating: false,
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

  if (!isOpen) return null;

  const activeCategories = cats.filter((c) => c.isActive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const sheet = (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative bg-white rounded-t-[28px] shadow-2xl w-full max-w-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{ height: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-wibe-surface rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0 border-b border-wibe">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-wibe-surface flex items-center justify-center"
            aria-label="بستن"
          >
            <X className="w-5 h-5 text-wibe-secondary" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="wibe-h3 font-bold text-foreground">فیلتر لیست‌ها</h2>
            <p className="wibe-caption text-wibe-secondary mt-0.5">
              {activeCount > 0 ? `${activeCount.toLocaleString('fa-IR')} فیلتر فعال` : 'بدون فیلتر'}
            </p>
          </div>
          {canReset && (
            <button
              onClick={handleReset}
              className="wibe-caption font-medium text-primary"
            >
              پاک کردن
            </button>
          )}
          {!canReset && <div className="w-10" />}
        </div>

        {/* Live Result */}
        <div className="px-6 py-3 bg-primary/5 flex-shrink-0">
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
                className="flex-shrink-0 h-9 px-4 rounded-[20px] bg-wibe-surface text-foreground wibe-caption font-medium hover:bg-wibe-surface transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {onViewModeChange ? (
            <div className="mb-5 border-b border-wibe pb-5">
              <p className="mb-3 wibe-body font-semibold text-foreground">نمایش</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onViewModeChange('grid')}
                  aria-pressed={viewMode === 'grid'}
                  className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border wibe-caption font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-wibe bg-wibe-surface text-wibe-secondary'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  گرید
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange('compact')}
                  aria-pressed={viewMode === 'compact'}
                  className={`inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border wibe-caption font-medium transition-colors ${
                    viewMode === 'compact'
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-wibe bg-wibe-surface text-wibe-secondary'
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
                className="w-5 h-5 rounded border-wibe text-primary"
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
                  className="w-5 h-5 rounded border-wibe text-primary"
                />
                <span className="wibe-small text-foreground">{cat.icon} {cat.name}</span>
              </label>
            ))}
          </AccordionSection>

          {/* Sort */}
          <AccordionSection
            title="مرتب‌سازی"
            open={openSections.sort}
            onToggle={() => toggleSection('sort')}
          >
            {SORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="sort"
                  checked={localState.sortBy === opt.value}
                  onChange={() => setLocalState((s) => ({ ...s, sortBy: opt.value }))}
                  className="w-4 h-4 border-wibe text-primary"
                />
                <span className="wibe-small text-foreground">{opt.label}</span>
              </label>
            ))}
          </AccordionSection>

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
                  className={`h-8 px-4 rounded-[20px] wibe-caption font-medium transition-colors ${
                    localState.creatorType === opt.value
                      ? 'bg-primary/10 border-2 border-primary text-primary font-semibold'
                      : 'bg-wibe-surface border border-wibe text-wibe-secondary'
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
              <div className="flex justify-between wibe-small text-wibe-secondary">
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
                className="w-full h-2 bg-wibe-surface rounded-full accent-primary"
              />
              <div className="flex justify-between text-xs text-wibe-secondary">
                <span>۰</span>
                <span>۱۰۰</span>
              </div>
            </div>
          </AccordionSection>

          {/* Min Rating */}
          <AccordionSection
            title="حداقل امتیاز"
            open={openSections.rating}
            onToggle={() => toggleSection('rating')}
          >
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setLocalState((s) => ({
                      ...s,
                      minRating: s.minRating === n ? 0 : n,
                    }))
                  }
                  className="p-2 rounded-lg hover:bg-wibe-surface transition-colors"
                  aria-label={`${n.toLocaleString('fa-IR')} ستاره`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      n <= localState.minRating ? 'fill-amber-400 text-amber-400' : 'text-wibe-secondary/40'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="wibe-caption text-wibe-secondary mt-2">
              {localState.minRating > 0
                ? `${localState.minRating.toLocaleString('fa-IR')}+ ستاره`
                : 'بدون حد'}
            </p>
          </AccordionSection>
        </div>

        {/* Sticky Bottom CTA */}
        <div className="p-6 pt-4 flex-shrink-0 border-t border-wibe">
          <button
            type="button"
            onClick={handleApply}
            className="w-full h-14 rounded-[20px] bg-gradient-to-r from-primary to-primary-dark text-white font-semibold wibe-body flex items-center justify-center shadow-lg hover:opacity-95 transition-opacity"
          >
            اعمال فیلتر ({resultCount.toLocaleString('fa-IR')} نتیجه)
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(sheet, document.body);
  }
  return sheet;
}
