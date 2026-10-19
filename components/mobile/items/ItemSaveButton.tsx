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
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          isHero
            ? 'border-white/30 bg-white/15 hover:bg-white/25 backdrop-blur-sm'
            : 'border-wibe bg-wibe-card hover:border-primary/40 hover:bg-primary/5'
        }`}
        aria-label="ورود برای ذخیره"
        title="ورود برای ذخیره"
      >
        <Bookmark className={`w-5 h-5 ${isHero ? 'text-white' : 'text-wibe-secondary'}`} />
      </Link>
    );
  }

  if (status === 'loading' || (status === 'authenticated' && deferReady && viewerLoading)) {
    return (
      <div
        className={`h-10 w-10 animate-pulse rounded-full ${isHero ? 'bg-white/20' : 'bg-wibe-surface'}`}
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
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          isSaved
            ? isPrivate
              ? 'border-foreground bg-foreground shadow-sm hover:opacity-90'
              : 'border-primary bg-primary shadow-sm hover:bg-primary-dark'
            : isHero
              ? 'border-white/30 bg-white/15 hover:bg-white/25 backdrop-blur-sm'
              : 'border-wibe bg-wibe-card hover:border-primary/40 hover:bg-primary/5'
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
          className={`h-4 w-4 transition-colors ${
            isSaved ? 'fill-white text-white' : isHero ? 'text-white' : 'text-wibe-secondary'
          }`}
        />
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

