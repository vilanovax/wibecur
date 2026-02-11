'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { useSession } from 'next-auth/react';
import SaveToPersonalListModal from './SaveToPersonalListModal';

interface ItemSaveButtonProps {
  itemId: string;
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

export default function ItemSaveButton({ itemId }: ItemSaveButtonProps) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedStatus, setSavedStatus] = useState<SavedStatus>({
    savedInPrivateList: false,
    savedInPublicList: false,
    lists: [],
  });

  // Fetch saved status when component mounts or modal closes
  useEffect(() => {
    if (session?.user) {
      fetchSavedStatus();
    }
  }, [session?.user, itemId]);

  const fetchSavedStatus = async () => {
    try {
      const res = await fetch(`/api/items/${itemId}/saved-status`);
      if (res.ok) {
        const data = await res.json();
        setSavedStatus(data);
      }
    } catch (error) {
      console.error('Error fetching saved status:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Refresh saved status after closing modal
    fetchSavedStatus();
  };

  // Don't render if user is not logged in
  if (!session?.user) {
    return null;
  }

  // Determine icon style based on saved status
  const isSaved = savedStatus.savedInPrivateList || savedStatus.savedInPublicList;
  const isPrivate = savedStatus.savedInPrivateList;
  const savedCount = savedStatus.lists.length;

  return (
    <>
      <button
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
            isSaved
              ? 'text-white fill-white'
              : 'text-gray-600'
          }`}
        />
        {savedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
            {savedCount}
          </span>
        )}
      </button>

      <SaveToPersonalListModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        itemId={itemId}
      />
    </>
  );
}

