'use client';

import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemReportButton from '@/components/mobile/items/ItemReportButton';

interface ItemDetailTopActionsProps {
  itemId: string;
  likeCount: number;
}

/** ذخیره + پسند + گزارش — sticky زیر هدر */
export default function ItemDetailTopActions({
  itemId,
  likeCount,
}: ItemDetailTopActionsProps) {
  return (
    <div className="sticky top-16 z-30 flex items-center justify-end gap-2 px-4 py-2.5 bg-wibe-surface/95 backdrop-blur-sm border-b border-wibe/80">
      <ItemSaveButton itemId={itemId} />
      <ItemLikeButton
        itemId={itemId}
        initialLikeCount={likeCount}
        variant="compact"
      />
      <ItemReportButton itemId={itemId} />
    </div>
  );
}
