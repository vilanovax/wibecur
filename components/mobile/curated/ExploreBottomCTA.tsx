'use client';

import Link from 'next/link';

interface ExploreBottomCTAProps {
  onOpenCreate?: () => void;
}

export default function ExploreBottomCTA({ onOpenCreate }: ExploreBottomCTAProps) {
  return (
    <section
      className="mx-4 mb-8 rounded-[18px] overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary p-6 shadow-lg"
      aria-label="ساخت لیست"
    >
      <p className="text-white/90 text-[18px] font-bold mb-1">
        ✨ لیست خودتو بساز
      </p>
      <p className="text-white/80 text-[13px] mb-4">
        ۵۰ ثانیه طول می‌کشه
      </p>
      {onOpenCreate ? (
        <button
          type="button"
          onClick={onOpenCreate}
          className="w-full py-3 px-4 rounded-[14px] bg-white text-primary font-semibold text-[14px] shadow-md hover:bg-white/95 active:scale-[0.99] transition-all"
        >
          ساخت لیست حرفه‌ای
        </button>
      ) : (
        <Link
          href="/user-lists?openCreate=1"
          className="block w-full py-3 px-4 rounded-[14px] bg-white text-primary font-semibold text-[14px] shadow-md hover:bg-white/95 active:scale-[0.99] transition-all text-center"
        >
          ساخت لیست حرفه‌ای
        </Link>
      )}
    </section>
  );
}
