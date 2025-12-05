'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useSession } from 'next-auth/react';
import SaveToPersonalListModal from './SaveToPersonalListModal';

interface ItemSaveButtonProps {
  itemId: string;
}

export default function ItemSaveButton({ itemId }: ItemSaveButtonProps) {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Don't render if user is not logged in
  if (!session?.user) {
    return null;
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
        aria-label="ذخیره در لیست"
      >
        <Bookmark className="w-5 h-5 text-gray-600" />
      </button>

      <SaveToPersonalListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemId={itemId}
      />
    </>
  );
}

