'use client';

import { Plus, CalendarDays } from 'lucide-react';
import FeaturedStatusStrip from './FeaturedStatusStrip';
import FeaturedMobilePreview, { type PreviewList } from './FeaturedMobilePreview';
import UpcomingSlotsGrid from './UpcomingSlotsGrid';
import FeaturedPerformanceSection from './FeaturedPerformanceSection';
import FeaturedHistoryAccordion from './FeaturedHistoryAccordion';
import type { SlotItem } from '../FeaturedManagementClient';

type Props = {
  current: SlotItem | null;
  fallbackList: { id: string; title: string; slug: string } | null;
  upcoming: SlotItem[];
  past: SlotItem[];
  previewList: PreviewList | null;
  previewMode: 'live' | 'fallback' | 'empty';
  formatDate: (s: string) => string;
  remainingText: string | null;
  now: Date;
  onEditCurrent: () => void;
  onRemoveCurrent: () => void;
  onAddSlot: () => void;
  onEditSlot: (slot: SlotItem) => void;
  onDeleteSlot: (id: string) => void;
};

export default function FeaturedSchedulerTab({
  current,
  fallbackList,
  upcoming,
  past,
  previewList,
  previewMode,
  formatDate,
  remainingText,
  now,
  onEditCurrent,
  onRemoveCurrent,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
}: Props) {
  const totalScheduled = (current ? 1 : 0) + upcoming.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]" dir="rtl">
      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {totalScheduled.toLocaleString('fa-IR')} اسلات برنامه‌ریزی‌شده
            {upcoming.length > 0 && (
              <span className="text-[var(--color-text-subtle)]">
                · {upcoming.length.toLocaleString('fa-IR')} در صف
              </span>
            )}
          </span>
        </div>

        <FeaturedStatusStrip
          current={current}
          fallbackList={fallbackList}
          formatDate={formatDate}
          remainingText={remainingText}
          onEdit={onEditCurrent}
          onRemove={onRemoveCurrent}
          onAddClick={onAddSlot}
        />

        <div className="lg:hidden">
          <FeaturedMobilePreview list={previewList} mode={previewMode} />
        </div>

        <button
          type="button"
          onClick={onAddSlot}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--color-bg)] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">افزودن اسلات زمان‌بندی‌شده</span>
        </button>

        {upcoming.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              برنامهٔ بعدی ({upcoming.length.toLocaleString('fa-IR')})
            </h2>
            <UpcomingSlotsGrid
              slots={upcoming}
              formatDate={formatDate}
              now={now}
              onEdit={onEditSlot}
              onDelete={onDeleteSlot}
            />
          </section>
        )}

        {current && <FeaturedPerformanceSection slotId={current.id} />}

        <FeaturedHistoryAccordion past={past} formatDate={formatDate} />
      </div>

      <div className="hidden lg:block">
        <FeaturedMobilePreview list={previewList} mode={previewMode} />
      </div>
    </div>
  );
}
