'use client';

import Link from 'next/link';

export default function SponsoredSlotCard() {
  return (
    <Link
      href="/sponsored/1"
      className="block overflow-hidden rounded-xl border border-primary/20 bg-wibe-card shadow-sm transition-transform active:scale-[0.99]"
    >
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
        <span className="text-3xl">✨</span>
      </div>
      <div className="p-2.5">
        <span className="wibe-caption font-medium text-primary">ویژه · اسپانسر</span>
        <h3 className="mt-0.5 line-clamp-2 wibe-small font-semibold text-foreground">
          مجموعه کیوریت‌شده ویژه
        </h3>
      </div>
    </Link>
  );
}
