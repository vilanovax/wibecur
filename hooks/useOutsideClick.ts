'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls handler when a click occurs outside of the given ref(s).
 *
 * handler و ref در ref نگه‌داری می‌شوند تا listener فقط با تغییر `enabled`
 * (نه در هر render به‌خاطر prop‌های inline) دوباره ثبت شود.
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true
) {
  const handlerRef = useRef(handler);
  const targetRef = useRef(ref);
  handlerRef.current = handler;
  targetRef.current = ref;

  useEffect(() => {
    if (!enabled) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const current = targetRef.current;
      const refs = Array.isArray(current) ? current : [current];
      const outside = refs.every((r) => r.current && !r.current.contains(target));
      if (outside) handlerRef.current();
    }

    document.addEventListener('mousedown', handleClick, true);
    return () => document.removeEventListener('mousedown', handleClick, true);
  }, [enabled]);
}
