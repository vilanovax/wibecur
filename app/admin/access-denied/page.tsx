import { Suspense } from 'react';
import AccessDeniedClient from './AccessDeniedClient';

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <AccessDeniedClient />
    </Suspense>
  );
}
