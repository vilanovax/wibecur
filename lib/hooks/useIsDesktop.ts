'use client';

import { useEffect, useState } from 'react';

export const DESKTOP_BREAKPOINT_PX = 1024;

/** true when viewport width >= lg (1024px) */
export function useIsDesktop(breakpointPx = DESKTOP_BREAKPOINT_PX) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpointPx]);

  return isDesktop;
}
