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
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-wibe bg-white transition-colors hover:border-red-300 hover:bg-red-50"
        aria-label="گزارش آیتم"
        title="گزارش آیتم"
      >
        <Flag className="h-4 w-4 text-wibe-secondary transition-colors hover:text-red-600" />
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

