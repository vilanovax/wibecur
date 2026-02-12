'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ListDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4" dir="rtl">
      <p className="text-xl font-bold text-gray-800 mb-2">لیست لود نشد</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
      >
        تلاش دوباره
      </button>
      <Link href="/lists" className="mt-3 text-sm text-primary font-medium">
        بازگشت به لیست‌ها
      </Link>
    </div>
  );
}
