'use client';

import Link from 'next/link';

export default function SponsoredSlotCard() {
  return (
    <Link
      href="/sponsored/1"
      className="block bg-white rounded-[20px] overflow-hidden shadow-sm border border-indigo-100 hover:shadow-md transition-all"
    >
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <span className="text-4xl">✨</span>
      </div>
      <div className="p-3">
        <span className="text-[10px] text-indigo-600 font-medium">ویژه · اسپانسر</span>
        <h3 className="font-semibold text-[14px] text-gray-900 mt-1">
          Featured Curated Collection
        </h3>
        <p className="text-[12px] text-gray-500 mt-0.5">Sponsored by …</p>
      </div>
    </Link>
  );
}
