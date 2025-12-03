'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import ItemReportModal from './ItemReportModal';
import { useSession } from 'next-auth/react';

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
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50"
      >
        <Flag className="w-4 h-4" />
        <span>گزارش</span>
      </button>

      <ItemReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemId={itemId}
        onReportSuccess={handleReportSuccess}
      />
    </>
  );
}

