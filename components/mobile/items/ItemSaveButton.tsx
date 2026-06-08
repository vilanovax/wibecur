'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { useSession } from 'next-auth/react';

const SaveToPersonalListModal = dynamic(() => import('./SaveToPersonalListModal'), { ssr: false });

interface ItemSaveButtonProps {
  itemId: string;
  /** hero = روی پس‌زمینه تیره hero */
  variant?: 'default' | 'hero';
}

interface SavedStatus {
  savedInPrivateList: boolean;
  savedInPublicList: boolean;
  lists: Array<{
    id: string;
    title: string;
    isPublic: boolean;
  }>;
}

const EMPTY_SAVED_STATUS: SavedStatus = {
  savedInPrivateList: false,
  savedInPublicList: false,
  lists: [],
};

export default function ItemSaveButton({ itemId, variant = 'default' }: ItemSaveButtonProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // وضعیت ذخیره با react-query کش می‌شود تا ناوبری بین آیتم‌ها درخواست تکراری نزند.
  const { data: savedStatus = EMPTY_SAVED_STATUS } = useQuery<SavedStatus>({
    queryKey: ['item-saved-status', itemId],
    queryFn: async () => {
      const res = await fetch(`/api/items/${itemId}/saved-status`);
      if (!res.ok) throw new Error('saved-status fetch failed');
      return (await res.json()) as SavedStatus;
    },
    enabled: status === 'authenticated' && !!session?.user,
    staleTime: 60 * 1000,
    retry: false,
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    // پس از تغییرِ احتمالی در مودال، وضعیت تازه‌سازی شود.
    queryClient.invalidateQueries({ queryKey: ['item-saved-status', itemId] });
  };

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || `/items/${itemId}`)}`;
  const isHero = variant === 'hero';

  if (status === 'unauthenticated') {
    return (
      <Link
        href={loginHref}
        className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${
          isHero
            ? 'bg-white/15 border border-white/30 hover:bg-white/25 backdrop-blur-sm'
            : 'bg-white border-2 border-gray-300 hover:border-primary hover:bg-primary/5'
        }`}
        aria-label="ورود برای ذخیره"
        title="ورود برای ذخیره"
      >
        <Bookmark className={`w-5 h-5 ${isHero ? 'text-white' : 'text-gray-600'}`} />
      </Link>
    );
  }

  if (status === 'loading') {
    return (
      <div
        className={`w-10 h-10 rounded-full animate-pulse ${isHero ? 'bg-white/20' : 'bg-gray-200'}`}
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
        className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${
          isSaved
            ? isPrivate
              ? 'bg-gray-900 border-2 border-gray-900 hover:bg-black shadow-md'
              : 'bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 shadow-md'
            : isHero
              ? 'bg-white/15 border border-white/30 hover:bg-white/25 backdrop-blur-sm'
              : 'bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
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
          className={`w-5 h-5 transition-all ${
            isSaved ? 'text-white fill-white' : isHero ? 'text-white' : 'text-gray-600'
          }`}
        />
        {savedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {savedCount}
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

