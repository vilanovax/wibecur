'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('App Error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-wibe-surface flex flex-col items-center justify-center px-4 pb-24"
      dir="rtl"
    >
      <Card className="w-full max-w-sm bg-popover p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-8 text-destructive" />
          </div>
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">
          یک چیزی درست پیش نرفت
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          لطفاً دوباره امتحان کن یا به صفحهٔ اصلی برو.
        </p>
        <div className="flex flex-col gap-3">
          <Button type="button" variant="brand" size="lg" className="w-full" onClick={reset}>
            <RefreshCw className="size-5" />
            تلاش دوباره
          </Button>
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => router.push('/')}>
            <Home className="size-5" />
            بازگشت به خانه
          </Button>
        </div>
      </Card>
    </div>
  );
}
