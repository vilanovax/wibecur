'use client';

import { useSyncExternalStore } from 'react';

export const DESKTOP_BREAKPOINT_PX = 1024;

function mediaQuery(breakpointPx: number) {
  return `(min-width: ${breakpointPx}px)`;
}

/** true when viewport width >= lg (1024px) */
export function useIsDesktop(breakpointPx = DESKTOP_BREAKPOINT_PX) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia(mediaQuery(breakpointPx));
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(mediaQuery(breakpointPx)).matches,
    () => false
  );
}
