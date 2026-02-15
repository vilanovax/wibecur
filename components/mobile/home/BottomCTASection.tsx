'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function BottomCTASection() {
  return (
    <section className="px-4 pb-12 pt-2" aria-label="ساخت لیست">
      <Link
        href="/user-lists?openCreate=1"
        className="block rounded-[24px] overflow-hidden p-6 bg-gradient-to-br from-primary via-primary-light to-secondary text-white shadow-vibe-hero hover:shadow-vibe-floating active:scale-[0.99] transition-all"
      >
        <p className="text-[18px] font-bold mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          لیست خودتو بساز
        </p>
        <p className="text-white/90 text-[13px] mb-4">کمتر از ۶۰ ثانیه</p>
        <span className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-[18px] bg-white text-primary font-semibold text-[14px]">
          شروع
        </span>
      </Link>
    </section>
  );
}
