'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function CreateListPrompt() {
  return (
    <section className="px-4">
      <Link
        href="/lists/create"
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-l from-violet-50 to-purple-50 border border-violet-200/50 p-4 hover:from-violet-100 hover:to-purple-100 active:scale-[0.99] transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-gray-900">لیست مورد علاقت رو نمیبینی؟</p>
          <p className="text-[12px] text-gray-500 mt-0.5">خودت بساز و با بقیه به اشتراک بذار</p>
        </div>
        <span className="text-violet-600 text-[13px] font-medium flex-shrink-0">بزن بریم</span>
      </Link>
    </section>
  );
}
