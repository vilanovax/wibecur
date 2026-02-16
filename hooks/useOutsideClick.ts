'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Calls handler when a click occurs outside of the given ref(s).
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const refs = Array.isArray(ref) ? ref : [ref];

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const outside = refs.every((r) => r.current && !r.current.contains(target));
      if (outside) handler();
    }

    document.addEventListener('mousedown', handleClick, true);
    return () => document.removeEventListener('mousedown', handleClick, true);
  }, [ref, handler, enabled]);
}
