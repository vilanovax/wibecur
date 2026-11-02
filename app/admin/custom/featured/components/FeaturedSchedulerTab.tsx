'use client';

import { Plus } from 'lucide-react';
import FeaturedStatusStrip from './FeaturedStatusStrip';
import FeaturedMobilePreview, { type PreviewList } from './FeaturedMobilePreview';
import UpcomingSlotsGrid from './UpcomingSlotsGrid';
import FeaturedPerformanceSection from './FeaturedPerformanceSection';
import FeaturedHistoryAccordion from './FeaturedHistoryAccordion';
import type { SlotItem } from '../FeaturedManagementClient';
import type { FeaturedSlotPerformance } from '@/lib/admin/featured-management-types';

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
  initialPerformance?: FeaturedSlotPerformance | null;
  initialRecommendations?: string[];
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
  initialPerformance = null,
  initialRecommendations = [],
}: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]" dir="rtl">
      <div className="min-w-0 space-y-4">
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

        {upcoming.length > 0 ? (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold leading-snug text-(--color-text)">
                برنامهٔ بعدی ({upcoming.length.toLocaleString('fa-IR')})
              </h2>
              <button
                type="button"
                onClick={onAddSlot}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-(--color-border) px-3 text-sm text-wibe-secondary hover:bg-(--color-bg) hover:text-(--color-text)"
              >
                <Plus className="size-4" strokeWidth={1.5} />
                افزودن به صف
              </button>
            </div>
            <UpcomingSlotsGrid
              slots={upcoming}
              formatDate={formatDate}
              now={now}
              onEdit={onEditSlot}
              onDelete={onDeleteSlot}
            />
          </section>
        ) : current ? (
          <button
            type="button"
            onClick={onAddSlot}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-(--color-border) px-3 text-sm text-wibe-secondary hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            زمان‌بندی اسلات بعدی
          </button>
        ) : null}

        {current && (
          <FeaturedPerformanceSection
            slotId={current.id}
            initialPerformance={initialPerformance}
            initialRecommendations={initialRecommendations}
          />
        )}

        <FeaturedHistoryAccordion past={past} formatDate={formatDate} />
      </div>

      <div className="hidden lg:block">
        <FeaturedMobilePreview list={previewList} mode={previewMode} />
      </div>
    </div>
  );
}
