'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ItemDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Item detail error:', error);
  }, [error]);

  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center px-4"
      dir="rtl"
    >
      <Card className="w-full max-w-sm bg-popover p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-warning/10">
            <AlertCircle className="size-7 text-warning" />
          </div>
        </div>
        <h2 className="mb-1 text-lg font-bold text-foreground">آیتم لود نشد</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          احتمالاً مشکل موقتی است، دوباره امتحان کن
        </p>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="brand" size="lg" className="w-full" onClick={reset}>
            <RefreshCw />
            تلاش دوباره
          </Button>
          <Link href="/" className="inline-flex h-12 items-center justify-center">
            <span className="text-sm font-medium text-brand">بازگشت به خانه</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
