'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Profile error:', error);
  }, [error]);

  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center px-4 pt-20"
      dir="rtl"
    >
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">پروفایل لود نشد</h2>
        <p className="text-gray-500 text-sm mb-5">
          دوباره امتحان کن یا به خانه برگرد
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش دوباره
          </button>
          <Link
            href="/"
            className="text-sm text-primary font-medium"
          >
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </div>
  );
}
