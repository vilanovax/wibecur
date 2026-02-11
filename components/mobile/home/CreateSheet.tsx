'use client';

import Link from 'next/link';
import BottomSheet from '@/components/mobile/shared/BottomSheet';

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSheet({ isOpen, onClose }: CreateSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="چی می‌خوای بسازی؟" maxHeight="40vh">
      <div className="flex flex-col gap-2 py-2">
        <Link
          href="/user-lists"
          className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-right"
          onClick={onClose}
        >
          <span className="text-2xl">🧩</span>
          <span className="font-medium text-gray-900">ساخت لیست جدید</span>
        </Link>
        <Link
          href="/lists"
          className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-right"
          onClick={onClose}
        >
          <span className="text-2xl">⭐</span>
          <span className="font-medium text-gray-900">ذخیره از لیست‌های آماده</span>
        </Link>
        <Link
          href="/user-lists"
          className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-right"
          onClick={onClose}
        >
          <span className="text-2xl">➕</span>
          <span className="font-medium text-gray-900">اضافه کردن آیتم</span>
        </Link>
      </div>
    </BottomSheet>
  );
}
