'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthScreen, { resolveSignupSource } from '@/components/auth/AuthScreen';
import { AuthPageFallback } from '@/components/auth/AuthShell';

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  const signupSource = resolveSignupSource(searchParams.get('source'));
  const initialPhone = searchParams.get('tel') ?? searchParams.get('phone') ?? '';
  const initialName = searchParams.get('name') ?? '';
  return (
    <AuthScreen
      mode="register"
      callbackUrl={callbackUrl}
      signupSource={signupSource}
      initialPhone={initialPhone}
      initialName={initialName}
    />
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<AuthPageFallback />}
    >
      <RegisterContent />
    </Suspense>
  );
}
