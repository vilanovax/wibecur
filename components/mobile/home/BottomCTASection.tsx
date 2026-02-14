'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function BottomCTASection() {
  return (
    <section className="px-4 pb-12 pt-2">
      <Link
        href="/user-lists?openCreate=1"
        className="flex items-center justify-between rounded-xl py-3 px-4 bg-gray-50/80 border border-gray-100 text-gray-700 hover:bg-gray-100/80 active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-medium leading-[1.6]">لیست خودتو بساز</span>
        </div>
        <span className="text-[12px] font-medium text-gray-500/75">کمتر از ۶۰ ثانیه</span>
      </Link>
    </section>
  );
}
