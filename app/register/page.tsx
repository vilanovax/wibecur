'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthScreen, { resolveSignupSource } from '@/components/auth/AuthScreen';

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  const signupSource = resolveSignupSource(searchParams.get('source'));
  return <AuthScreen mode="register" callbackUrl={callbackUrl} signupSource={signupSource} />;
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
