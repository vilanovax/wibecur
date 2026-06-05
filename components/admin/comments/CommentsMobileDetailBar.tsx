'use client';

import { PanelRightOpen } from 'lucide-react';

type Props = {
  visible: boolean;
  onOpen: () => void;
  label?: string;
};

/** نوار ثابت موبایل برای باز کردن پنل جزئیات وقتی inbox دو ستونه جا نمی‌شود */
export default function CommentsMobileDetailBar({
  visible,
  onOpen,
  label = 'مشاهده جزئیات',
}: Props) {
  if (!visible) return null;

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2 pointer-events-none"
      dir="rtl"
    >
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto w-full max-w-md mx-auto flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--primary)] text-white text-sm font-medium shadow-lg"
      >
        <PanelRightOpen className="w-4 h-4" />
        {label}
      </button>
    </div>
  );
}
