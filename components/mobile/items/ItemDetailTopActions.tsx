'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Flag, MoreHorizontal } from 'lucide-react';
import { useSession } from 'next-auth/react';
import ItemSaveButton from '@/components/mobile/items/ItemSaveButton';
import ItemLikeButton from '@/components/mobile/items/ItemLikeButton';
import ItemProfilePickButton from '@/components/mobile/items/ItemProfilePickButton';
import ItemShareButton from '@/components/mobile/items/ItemShareButton';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

const ItemReportModal = dynamic(() => import('./ItemReportModal'), { ssr: false });

interface ItemDetailTopActionsProps {
  itemId: string;
  likeCount: number;
  catalogItemId?: string | null;
  shareTitle: string;
  /** sticky زیر هدر (موبایل) | داخل کارت جزئیات (دسکتاپ) */
  variant?: 'bar' | 'inline';
}

const shareButtonClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-wibe bg-wibe-card text-wibe-secondary transition-colors hover:border-primary/25 hover:text-primary active:scale-95';

export default function ItemDetailTopActions({
  itemId,
  likeCount,
  catalogItemId,
  shareTitle,
  variant = 'bar',
}: ItemDetailTopActionsProps) {
  const { data: session } = useSession();
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const canReport = Boolean(session?.user);

  const actions = (
    <>
      <ItemSaveButton itemId={itemId} showCountBadge={false} />
      <ItemLikeButton itemId={itemId} initialLikeCount={likeCount} variant="compact" />
      <ItemShareButton
        title={shareTitle}
        className={shareButtonClass}
        iconClassName="h-4 w-4"
      />
      <button
        type="button"
        onClick={() => setMoreOpen(true)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-wibe bg-wibe-card text-wibe-secondary transition-colors hover:border-primary/25 hover:text-primary active:scale-95"
        aria-label="گزینه‌های بیشتر"
        title="بیشتر"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
    </>
  );

  const shell =
    variant === 'inline' ? (
      <div className="flex shrink-0 items-center justify-start gap-2" aria-label="ذخیره، پسند و اشتراک">
        {actions}
      </div>
    ) : (
      <div className="sticky top-16 z-30 flex items-center justify-start gap-2 border-b border-wibe/80 bg-wibe-surface/95 px-4 py-2.5 backdrop-blur-sm lg:hidden">
        {actions}
      </div>
    );

  return (
    <>
      {shell}

      <BottomSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="گزینه‌ها"
        maxHeight="50vh"
      >
        <div className="space-y-3 pb-2" dir="rtl">
          <ItemProfilePickButton
            itemId={itemId}
            catalogItemId={catalogItemId}
            variant="default"
          />

          {canReport ? (
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false);
                setReportOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-wibe bg-wibe-card px-3 py-2.5 wibe-small font-medium text-wibe-secondary transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Flag className="h-4 w-4 shrink-0" aria-hidden />
              گزارش آیتم
            </button>
          ) : null}
        </div>
      </BottomSheet>

      {canReport ? (
        <ItemReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          itemId={itemId}
          onReportSuccess={() => setReportOpen(false)}
        />
      ) : null}
    </>
  );
}
