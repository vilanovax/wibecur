'use client';

import { Share2 } from 'lucide-react';
import BookmarkButton from '@/components/mobile/lists/BookmarkButton';

interface ListDetailActionRowProps {
  listId: string;
  listSlug?: string;
  categorySlug?: string | null;
  saveCount: number;
  isOwner?: boolean;
  onBookmarkToggle?: (saved: boolean) => void;
  onShare: () => void;
  /** compact = فقط آیکون‌ها برای hero */
  variant?: 'row' | 'icons';
}

/** ذخیره + اشتراک — یک نقطه واحد (بدون تکرار) */
export default function ListDetailActionRow({
  listId,
  listSlug,
  categorySlug,
  saveCount,
  isOwner = false,
  onBookmarkToggle,
  onShare,
  variant = 'row',
}: ListDetailActionRowProps) {
  const bookmarkAnalytics = {
    listSlug,
    categorySlug,
    source: 'list_detail',
  };
  if (variant === 'icons') {
    return (
      <div className="flex items-center gap-2">
        {!isOwner && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wibe-card/95 shadow-sm backdrop-blur">
            <BookmarkButton
              listId={listId}
              initialBookmarkCount={saveCount}
              variant="icon"
              size="md"
              analytics={bookmarkAnalytics}
              onToggle={onBookmarkToggle}
            />
          </div>
        )}
        <button
          type="button"
          onClick={onShare}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-wibe-card/95 text-foreground shadow-sm backdrop-blur transition-transform active:scale-95"
          aria-label="اشتراک‌گذاری"
          title="اشتراک‌گذاری"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 lg:justify-end">
      {!isOwner && (
        <div className="min-w-0 flex-1 lg:flex-none lg:w-auto">
          <BookmarkButton
            listId={listId}
            initialBookmarkCount={saveCount}
            variant="button"
            size="lg"
            labelSave="ذخیره لیست"
            labelSaved="ذخیره شد ✓"
            analytics={bookmarkAnalytics}
            onToggle={onBookmarkToggle}
            className="lg:!h-11 lg:!min-w-[10.5rem] lg:!w-auto lg:!px-5 lg:!py-2.5"
          />
        </div>
      )}
      <button
        type="button"
        onClick={onShare}
        className={`flex shrink-0 items-center justify-center gap-2 rounded-xl border border-wibe bg-wibe-card font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 active:scale-[0.99] ${
          isOwner ? 'w-full py-3 wibe-small lg:min-w-[10rem] lg:w-auto' : 'h-12 w-12 lg:h-11'
        }`}
        aria-label="اشتراک‌گذاری"
        title="اشتراک‌گذاری"
      >
        <Share2 className={`${isOwner ? 'h-4 w-4' : 'h-5 w-5'} text-wibe-secondary`} />
        {isOwner && <span>اشتراک‌گذاری</span>}
      </button>
    </div>
  );
}
