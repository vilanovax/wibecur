'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Error:', error);
  }, [error]);

  const isDatabaseError = error.message?.includes('database') || 
                         error.message?.includes('Prisma') ||
                         error.message?.includes("Can't reach");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          خطا در بارگذاری صفحه
        </h1>
        {isDatabaseError ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              خطا در اتصال به دیتابیس
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                <strong>مشکل:</strong> {error.message}
              </p>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>بررسی کنید که دیتابیس Liara در دسترس است</li>
                <li>بررسی کنید که DATABASE_URL در .env.local درست است</li>
                <li>بررسی کنید که firewall دیتابیس اجازه اتصال می‌دهد</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center mb-6">{error.message}</p>
        )}
        <div className="flex gap-4 mt-6">
          <button
            onClick={reset}
            className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </button>
          <a
            href="/admin/dashboard"
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            بازگشت
          </a>
        </div>
      </div>
    </div>
  );
}

