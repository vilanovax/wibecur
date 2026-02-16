'use client';

import * as React from 'react';
import clsx from 'clsx';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  /** RTL: tooltip appears on the left of the trigger (toward content) */
  side?: 'left' | 'right';
  className?: string;
}

export default function Tooltip({ content, children, side = 'left', className }: TooltipProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div
      className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 z-50 px-3 py-2 text-sm font-medium text-admin-text-primary dark:text-white',
            'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-admin-border dark:border-gray-600',
            'whitespace-nowrap pointer-events-none',
            side === 'left'
              ? 'right-full mr-2'
              : 'left-full ml-2'
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
