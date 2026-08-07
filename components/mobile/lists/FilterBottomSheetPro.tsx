'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronUp, Star } from 'lucide-react';
export type SortOption = 'newest' | 'popular' | 'most_saved' | 'rising';
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

/** حال‌وهوا — ترند/ذخیره در نوار browse mode هستند، اینجا تکرار نشوند */
const VIBE_CHIPS: { value: VibeFilter; label: string }[] = [
  { value: 'sleep', label: '🌙 قبل خواب' },
  { value: 'comedy', label: '😂 کمدی' },
  { value: 'family', label: '👨‍👩‍👧 خانوادگی' },
  { value: 'drama', label: '🎭 درام' },
  { value: 'calm_movie', label: '🎬 آرامش‌بخش' },
  { value: 'cafe', label: '☕ کافه دنج' },
];

const CREATOR_OPTIONS: { value: CreatorType; label: string }[] = [
  { value: 'all', label: 'همه' },
  { value: 'top', label: '⭐ کیوریتورهای برتر' },
  { value: 'new', label: '🆕 تازه‌وارد' },
  { value: 'viral', label: '🔥 وایرال شده' },
];

const PRESETS: { id: string; label: string; apply: (state: FilterState) => FilterState }[] = [
  {
    id: 'sleep',
    label: '🌙 قبل خواب',
    apply: (s) => ({ ...s, vibes: new Set(['sleep' as VibeFilter]) }),
  },
  {
    id: 'top',
    label: '⭐ فقط برترین‌ها',
    apply: (s) => ({ ...s, minRating: 4, creatorType: 'top' as CreatorType }),
  },
];

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
    <div className="border-b border-gray-100">
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
}

export default function FilterBottomSheetPro({
  isOpen,
  onClose,
  categories: cats,
  filterState,
  getResultCount,
  onApply,
}: FilterBottomSheetProProps) {
  const [localState, setLocalState] = useState<FilterState>(filterState);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    sort: false,
    vibe: false,
    creator: false,
    itemCount: false,
    rating: false,
  });

  useEffect(() => {
    if (isOpen) setLocalState(filterState);
  }, [isOpen, filterState]);

  const resultCount = getResultCount(localState);

  const activeCount =
    localState.categories.size +
    (localState.sortBy !== 'newest' ? 1 : 0) +
    localState.vibes.size +
    (localState.creatorType !== 'all' ? 1 : 0) +
    (localState.minItemCount > 0 ? 1 : 0) +
    (localState.minRating > 0 ? 1 : 0);

  const hasChanges = JSON.stringify(localState) !== JSON.stringify(filterState);
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

  const toggleVibe = (v: VibeFilter) => {
    setLocalState((s) => {
      const next = new Set(s.vibes);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return { ...s, vibes: next };
    });
  };

  const handleReset = () => {
    setLocalState({
      categories: new Set(),
      sortBy: 'newest',
      vibes: new Set(),
      creatorType: 'all',
      minItemCount: 0,
      minRating: 0,
    });
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
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0 border-b border-gray-100">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="بستن"
          >
            <X className="w-5 h-5 text-wibe-secondary" />
          </button>
          <div className="flex-1 text-center">
            <h2 className="wibe-h3 font-bold text-foreground">فیلتر لیست‌ها</h2>
            <p className="wibe-caption text-wibe-secondary mt-0.5">
              {activeCount > 0 ? `${activeCount} فیلتر فعال` : 'بدون فیلتر'}
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
            {resultCount} لیست مطابق انتخاب شما
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
                className="flex-shrink-0 h-9 px-4 rounded-[20px] bg-gray-100 text-foreground wibe-caption font-medium hover:bg-gray-200 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

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
                className="w-5 h-5 rounded border-gray-300 text-primary"
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
                  className="w-5 h-5 rounded border-gray-300 text-primary"
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
                  className="w-4 h-4 border-gray-300 text-primary"
                />
                <span className="wibe-small text-foreground">{opt.label}</span>
              </label>
            ))}
          </AccordionSection>

          {/* Vibe */}
          <AccordionSection
            title="وایب / حال‌وهوا"
            open={openSections.vibe}
            onToggle={() => toggleSection('vibe')}
          >
            <div className="flex flex-wrap gap-2">
              {VIBE_CHIPS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleVibe(value)}
                  className={`h-8 px-4 rounded-[20px] wibe-caption font-medium transition-colors ${
                    localState.vibes.has(value)
                      ? 'bg-primary/10 border-2 border-primary text-primary font-semibold'
                      : 'bg-gray-50 border border-gray-200 text-wibe-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
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
                      : 'bg-gray-50 border border-gray-200 text-wibe-secondary'
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
                <span>حداقل {localState.minItemCount} آیتم</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={localState.minItemCount}
                onChange={(e) =>
                  setLocalState((s) => ({ ...s, minItemCount: parseInt(e.target.value, 10) }))
                }
                className="w-full h-2 bg-gray-200 rounded-full accent-primary"
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
                  className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  aria-label={`${n} ستاره`}
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
              {localState.minRating > 0 ? `${localState.minRating}+ ستاره` : 'بدون حد'}
            </p>
          </AccordionSection>
        </div>

        {/* Sticky Bottom CTA */}
        <div className="p-6 pt-4 flex-shrink-0 border-t border-gray-100">
          <button
            type="button"
            onClick={handleApply}
            className="w-full h-14 rounded-[20px] bg-gradient-to-r from-primary to-primary-dark text-white font-semibold wibe-body flex items-center justify-center shadow-lg hover:opacity-95 transition-opacity"
          >
            اعمال فیلتر ({resultCount} نتیجه)
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
