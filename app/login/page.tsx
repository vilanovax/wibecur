'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthScreen from '@/components/auth/AuthScreen';
import { AuthPageFallback } from '@/components/auth/AuthShell';

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
    <Suspense fallback={<AuthPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
