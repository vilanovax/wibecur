'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/lib/auth/permissions';
import { adminRadius } from '@/lib/admin/design-system/tokens';

export interface ActionMenuItem {
  label: string;
  permission?: Permission;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
  className?: string;
}

/**
 * منوی سه‌نقطه‌ای؛ هر آیتم می‌تواند permission داشته باشد.
 * آیتم‌های بدون دسترسی مخفی می‌شوند.
 */
export default function ActionMenu({ actions, className = '' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { can } = usePermissions();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visible = actions.filter(
    (a) => !a.permission || can(a.permission)
  );

  if (visible.length === 0) return null;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="منوی عملیات"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className={`absolute left-0 mt-1 min-w-[160px] ${adminRadius.card} border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 z-50`}
        >
          {visible.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className={`w-full text-right px-4 py-2 text-sm transition-colors ${
                action.variant === 'danger'
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
