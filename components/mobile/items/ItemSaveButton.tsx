'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useDeferReady } from '@/hooks/useDeferReady';
import {
  invalidateItemViewerState,
  useItemViewerState,
} from '@/hooks/useItemViewerState';

const SaveToPersonalListModal = dynamic(() => import('./SaveToPersonalListModal'), { ssr: false });

interface ItemSaveButtonProps {
  itemId: string;
  /** hero = روی پس‌زمینه تیره hero */
  variant?: 'default' | 'hero';
  /** Defer viewer-state fetch until idle (modal preview). */
  deferViewerState?: boolean;
  /** بج تعداد لیست‌ها — در پیش‌نمایش شلوغ است؛ پیش‌فرض روشن */
  showCountBadge?: boolean;
}

export default function ItemSaveButton({
  itemId,
  variant = 'default',
  deferViewerState = false,
  showCountBadge = true,
}: ItemSaveButtonProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const deferReady = useDeferReady(deferViewerState);

  const { data: viewerState, isLoading: viewerLoading } = useItemViewerState(itemId, {
    enabled: deferReady && status === 'authenticated' && !!session?.user,
  });
  const savedStatus = viewerState?.saved ?? {
    savedInPrivateList: false,
    savedInPublicList: false,
    lists: [],
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    invalidateItemViewerState(queryClient, itemId);
  };

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${itemId}`)}`;
  const isHero = variant === 'hero';

  if (status === 'unauthenticated') {
    return (
      <Link
        href={loginHref}
        className={`relative flex size-11 items-center justify-center rounded-full transition-colors ${
          isHero
            ? 'border border-background/30 bg-background/15 hover:bg-background/25 backdrop-blur-sm'
            : 'border border-border bg-popover hover:border-brand hover:bg-brand/5'
        }`}
        aria-label="ورود برای ذخیره"
        title="ورود برای ذخیره"
      >
        <Bookmark className={`size-5 ${isHero ? 'text-background' : 'text-muted-foreground'}`} />
      </Link>
    );
  }

  if (status === 'loading' || (status === 'authenticated' && deferReady && viewerLoading)) {
    return (
      <div
        className={`size-11 animate-pulse rounded-full ${isHero ? 'bg-background/20' : 'bg-muted'}`}
        aria-hidden
      />
    );
  }

  const isSaved = savedStatus.savedInPrivateList || savedStatus.savedInPublicList;
  const isPrivate = savedStatus.savedInPrivateList;
  const savedCount = savedStatus.lists.length;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className={`relative flex size-11 items-center justify-center rounded-full transition-colors ${
          isSaved
            ? isPrivate
              ? 'border border-foreground bg-foreground text-background'
              : 'border border-brand bg-brand text-brand-foreground'
            : isHero
              ? 'border border-background/30 bg-background/15 hover:bg-background/25 backdrop-blur-sm'
              : 'border border-border bg-popover hover:border-brand hover:bg-brand/5'
        }`}
        aria-label={
          isSaved
            ? isPrivate
              ? `ذخیره شده در ${savedCount.toLocaleString('fa-IR')} لیست خصوصی`
              : `ذخیره شده در ${savedCount.toLocaleString('fa-IR')} لیست عمومی`
            : 'ذخیره در لیست'
        }
      >
        <Bookmark
          className={`w-5 h-5 transition-colors ${
            isSaved ? 'fill-current text-current' : isHero ? 'text-background' : 'text-muted-foreground'
          }`}
        />
        {showCountBadge && savedCount > 0 ? (
          <span className="absolute -top-1 end-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold leading-none text-brand-foreground shadow-sm">
            {savedCount.toLocaleString('fa-IR')}
          </span>
        ) : null}
      </button>

      {isModalOpen && (
        <SaveToPersonalListModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          itemId={itemId}
        />
      )}
    </>
  );
}

