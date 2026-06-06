'use client';

import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';

interface ItemDetailTopActionsProps {
  itemId: string;
  likeCount: number;
  /** sticky زیر هدر (موبایل) | داخل کارت جزئیات (دسکتاپ) */
  variant?: 'bar' | 'inline';
}

export default function ItemDetailTopActions({
  itemId,
  likeCount,
  variant = 'bar',
}: ItemDetailTopActionsProps) {
  const actions = (
    <>
      <ItemSaveButton itemId={itemId} />
      <ItemLikeButton itemId={itemId} initialLikeCount={likeCount} variant="compact" />
      <ItemReportButton itemId={itemId} />
    </>
  );

  if (variant === 'inline') {
    return (
      <div className="flex shrink-0 items-center justify-start gap-2" aria-label="ذخیره، پسند و گزارش">
        {actions}
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-30 flex items-center justify-start gap-2 border-b border-wibe/80 bg-wibe-surface/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
      {actions}
    </div>
  );
}
