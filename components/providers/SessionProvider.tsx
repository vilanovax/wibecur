'use client';

import {
  SessionProvider as NextAuthSessionProvider,
  useSession,
} from 'next-auth/react';
import type { Session } from 'next-auth';
import { useEffect, useRef } from 'react';

const FOCUS_REFETCH_DELAY_MS = 1200;

function isTransientSessionFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('load failed') ||
    message.includes('aborted')
  );
}

/** بعد از بیدار شدن تب/سیستم، کمی صبر می‌کند تا شبکهٔ کروم از حالت suspended خارج شود. */
function SessionRefetchOnFocus({ children }: { children: React.ReactNode }) {
  const { update } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        if (!navigator.onLine) return;
        void update().catch((error: unknown) => {
          if (!isTransientSessionFetchError(error)) {
            console.warn('[session] refetch after focus failed:', error);
          }
        });
      }, FOCUS_REFETCH_DELAY_MS);
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [update]);

  return <>{children}</>;
}

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <SessionRefetchOnFocus>{children}</SessionRefetchOnFocus>
    </NextAuthSessionProvider>
  );
}
