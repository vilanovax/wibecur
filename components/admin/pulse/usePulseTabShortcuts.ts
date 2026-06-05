'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PulseTab } from '@/lib/admin/pulse-types';

const TAB_KEYS: Record<string, PulseTab> = {
  '1': 'live',
  '2': 'trend',
  '3': 'risk',
};

export function usePulseTabShortcuts() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }
      const tab = TAB_KEYS[e.key];
      if (!tab) return;
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'live') params.delete('tab');
      else params.set('tab', tab);
      const qs = params.toString();
      router.push(qs ? `/admin/pulse?${qs}` : '/admin/pulse');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, searchParams]);
}
