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
}

export default function ItemSaveButton({
  itemId,
  variant = 'default',
  deferViewerState = false,
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
        className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          isHero
            ? 'bg-white/15 border border-white/30 hover:bg-white/25 backdrop-blur-sm'
            : 'border border-wibe bg-wibe-surface hover:border-primary/35 hover:bg-primary/[0.04]'
        }`}
        aria-label="ورود برای ذخیره"
        title="ورود برای ذخیره"
      >
        <Bookmark className={`h-5 w-5 ${isHero ? 'text-white' : 'text-wibe-secondary'}`} />
      </Link>
    );
  }

  if (status === 'loading' || (status === 'authenticated' && deferReady && viewerLoading)) {
    return (
      <div
        className={`h-11 w-11 rounded-full animate-pulse ${isHero ? 'bg-white/20' : 'bg-wibe-surface'}`}
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
        className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          isSaved
            ? isPrivate
              ? 'border-2 border-foreground bg-foreground shadow-sm hover:opacity-90'
              : 'border-2 border-primary bg-primary shadow-sm hover:bg-primary-dark'
            : isHero
              ? 'border border-white/30 bg-white/15 backdrop-blur-sm hover:bg-white/25'
              : 'border border-wibe bg-wibe-surface hover:border-primary/35 hover:bg-primary/[0.04]'
        }`}
        aria-label={
          isSaved
            ? isPrivate
              ? `ذخیره شده در ${savedCount} لیست خصوصی`
              : `ذخیره شده در ${savedCount} لیست عمومی`
            : 'ذخیره در لیست'
        }
      >
        <Bookmark
          className={`h-5 w-5 transition-colors ${
            isSaved ? 'fill-white text-white' : isHero ? 'text-white' : 'text-wibe-secondary'
          }`}
        />
        {savedCount > 0 && (
          <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-0.5 text-xs font-bold text-white shadow-sm tabular-nums">
            {savedCount.toLocaleString('fa-IR')}
          </span>
        )}
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

