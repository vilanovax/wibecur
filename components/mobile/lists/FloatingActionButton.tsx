'use client';

import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-110 flex items-center justify-center"
      aria-label="پیشنهاد لیست یا آیتم"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}

