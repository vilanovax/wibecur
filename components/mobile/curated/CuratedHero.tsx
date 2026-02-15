'use client';

import Link from 'next/link';

export default function CuratedHero() {
  return (
    <div className="rounded-[22px] p-5 mx-4 mt-4 bg-gradient-to-br from-indigo-50 via-purple-50/50 to-pink-50/30 border border-indigo-100">
      <h2 className="font-bold text-[18px] leading-tight text-gray-900">
        کیوریشن کاربران وایب
      </h2>
      <p className="text-[14px] text-gray-600 mt-1 leading-relaxed">
        لیست‌هایی که با سلیقه و تخصص ساخته شده‌اند
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Link
          href="/user-lists?openCreate=1"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-[14px] shadow-md hover:bg-primary-dark transition-colors"
        >
          ساخت لیست حرفه‌ای
        </Link>
        <Link
          href="/curated/guide"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white/80 text-gray-700 font-medium text-[14px] border border-gray-200 hover:bg-white transition-colors"
        >
          چگونه کیوریتور شویم؟
        </Link>
      </div>
    </div>
  );
}
