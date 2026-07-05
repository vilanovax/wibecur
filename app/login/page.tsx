'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthScreen from '@/components/auth/AuthScreen';

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  return <AuthScreen mode="login" callbackUrl={callbackUrl} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
