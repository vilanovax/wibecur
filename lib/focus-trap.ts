/** عناصر قابل‌فوکوس داخل یک کانتینر (برای trap دیالوگ). */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
  );
}

/** Tab را داخل کانتینر نگه می‌دارد؛ اولین فوکوس‌پذیر را فعال می‌کند. */
export function attachFocusTrap(
  container: HTMLElement,
  options?: { restoreFocus?: boolean }
): () => void {
  const previouslyFocused =
    options?.restoreFocus !== false && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

  const focusables = getFocusableElements(container);
  const initial = focusables[0] ?? container;
  if (typeof initial.focus === 'function') {
    initial.focus();
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const items = getFocusableElements(container);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  return () => {
    document.removeEventListener('keydown', onKeyDown);
    previouslyFocused?.focus?.();
  };
}
