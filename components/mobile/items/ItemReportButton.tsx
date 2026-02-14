'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Flag } from 'lucide-react';
import { useSession } from 'next-auth/react';

const ItemReportModal = dynamic(() => import('./ItemReportModal'), { ssr: false });

interface ItemReportButtonProps {
  itemId: string;
}

export default function ItemReportButton({ itemId }: ItemReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();

  // Only show report button if user is logged in
  if (!session?.user) {
    return null;
  }

  const handleReportSuccess = () => {
    // Optionally show a success message
    // You can add a toast notification here if needed
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm"
        aria-label="گزارش"
      >
        <Flag className="w-4 h-4 text-gray-600 hover:text-red-600" />
      </button>

      {isModalOpen && (
        <ItemReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itemId={itemId}
          onReportSuccess={handleReportSuccess}
        />
      )}
    </>
  );
}

