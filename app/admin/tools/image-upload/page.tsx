import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import StandaloneImageUploadClient from './StandaloneImageUploadClient';

export default async function StandaloneImageUploadPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6" dir="rtl">
      <header>
        <Link
          href="/admin/media"
          className="mb-2 inline-flex items-center gap-1 text-xs text-wibe-secondary hover:text-primary"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          بازگشت به رسانه
        </Link>
        <h1 className="text-xl font-bold text-(--color-text)">آپلود تصویر و گرفتن لینک</h1>
        <p className="mt-1 text-sm text-wibe-secondary">
          بدون وابستگی به کاور لیست — فایل را آپلود کن و URL را کپی کن.
        </p>
      </header>

      <StandaloneImageUploadClient />
    </div>
  );
}
