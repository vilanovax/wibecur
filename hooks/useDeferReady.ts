'use client';

import { useEffect, useState } from 'react';

/** Defer non-critical fetches until the browser is idle. */
export function useDeferReady(defer = false): boolean {
  const [ready, setReady] = useState(!defer);

  useEffect(() => {
    if (!defer) {
      setReady(true);
      return;
    }
    setReady(false);
    const id = requestIdleCallback(() => setReady(true), { timeout: 1500 });
    return () => cancelIdleCallback(id);
  }, [defer]);

  return ready;
}
