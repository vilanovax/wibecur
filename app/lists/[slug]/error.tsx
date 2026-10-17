'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4" dir="rtl">
      <p className="mb-2 text-xl font-bold text-foreground">لیست لود نشد</p>
      <Button type="button" variant="brand" size="lg" className="mt-4" onClick={reset}>
        تلاش دوباره
      </Button>
      <Link href="/lists" className="mt-3 inline-flex h-12 items-center">
        <span className="text-sm font-medium text-brand">بازگشت به لیست‌ها</span>
      </Link>
    </div>
  );
}
