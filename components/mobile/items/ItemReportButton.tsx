'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Flag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRequireAuth } from '@/hooks/useRequireAuth';

const ItemReportModal = dynamic(() => import('./ItemReportModal'), { ssr: false });

interface ItemReportButtonProps {
  itemId: string;
  variant?: 'default' | 'icon';
}

export default function ItemReportButton({ itemId, variant = 'default' }: ItemReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();
  const { requireAuth, AuthSheet } = useRequireAuth();

  const handleReportSuccess = () => {
    // Optionally show a success message
    // You can add a toast notification here if needed
  };

  return (
    <>
      <button
        onClick={requireAuth(() => setIsModalOpen(true))}
        className={
          variant === 'icon'
            ? 'w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors'
            : 'w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all shadow-sm'
        }
        aria-label="گزارش"
      >
        <Flag className={variant === 'icon' ? 'w-4 h-4 text-white/80' : 'w-4 h-4 text-gray-600 hover:text-red-600'} />
      </button>

      {isModalOpen && (
        <ItemReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          itemId={itemId}
          onReportSuccess={handleReportSuccess}
        />
      )}
      <AuthSheet />
    </>
  );
}

