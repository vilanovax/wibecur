'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 pb-24"
      dir="rtl"
    >
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          اوپس! یه چیزی درست پیش نرفت
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          لطفاً دوباره امتحان کن یا به صفحه اصلی برو
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            تلاش دوباره
          </button>
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </div>
  );
}
