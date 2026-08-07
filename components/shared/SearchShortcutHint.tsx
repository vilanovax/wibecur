'use client';

import { useEffect, useState } from 'react';

/** برچسب میانبر جستجو — ⌘K در macOS، Ctrl+K در ویندوز/لینوکس */
export default function SearchShortcutHint({ className = '' }: { className?: string }) {
  const [label, setLabel] = useState('Ctrl+K');

  useEffect(() => {
    const isApple =
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    setLabel(isApple ? '⌘K' : 'Ctrl+K');
  }, []);

  return (
    <kbd
      className={`hidden xl:inline-flex rounded-md border border-wibe bg-wibe-card px-1.5 py-0.5 wibe-caption text-wibe-secondary tabular-nums ${className}`}
    >
      {label}
    </kbd>
  );
}
