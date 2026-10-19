'use client';

import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';
import ItemProfilePickButton from '@/components/mobile/items/ItemProfilePickButton';
import ItemShareButton from '@/components/mobile/items/ItemShareButton';

interface ItemDetailTopActionsProps {
  itemId: string;
  likeCount: number;
  catalogItemId?: string | null;
  shareTitle: string;
  /** sticky زیر هدر (موبایل) | داخل کارت جزئیات (دسکتاپ) */
  variant?: 'bar' | 'inline';
}

const shareButtonClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-wibe bg-wibe-card text-wibe-secondary transition-colors hover:border-primary/25 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95';

export default function ItemDetailTopActions({
  itemId,
  likeCount,
  catalogItemId,
  shareTitle,
  variant = 'bar',
}: ItemDetailTopActionsProps) {
  const actions = (
    <>
      <ItemSaveButton itemId={itemId} />
      <ItemProfilePickButton itemId={itemId} catalogItemId={catalogItemId} variant="compact" />
      <ItemLikeButton itemId={itemId} initialLikeCount={likeCount} variant="compact" />
      <ItemShareButton
        title={shareTitle}
        className={shareButtonClass}
        iconClassName="h-4 w-4"
      />
      <ItemReportButton itemId={itemId} />
    </>
  );

  if (variant === 'inline') {
    return (
      <div
        className="flex flex-wrap items-center justify-start gap-2"
        aria-label="ذخیره، پسند و اشتراک"
      >
        {actions}
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-30 border-b border-wibe/70 bg-wibe-surface/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
      <div
        className="flex items-center justify-start gap-2"
        aria-label="ذخیره، پسند و اشتراک"
      >
        {actions}
      </div>
    </div>
  );
}
