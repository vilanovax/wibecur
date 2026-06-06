'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  Power,
  Trash2,
  BarChart3,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import type { ListIntelligenceRow } from '@/lib/admin/lists-intelligence';

interface ListCardMoreMenuProps {
  row: ListIntelligenceRow;
  onFeature: () => void;
  onDisable: () => void;
  onMoveToTrash?: () => void;
  featureLoading?: boolean;
  disableLoading?: boolean;
}

export default function ListCardMoreMenu({
  row,
  onFeature,
  onDisable,
  onMoveToTrash,
  featureLoading,
  disableLoading,
}: ListCardMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
        aria-label="عملیات بیشتر"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg py-1 z-50">
          <Link
            href={`/admin/lists/${row.id}/edit`}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
            onClick={() => setOpen(false)}
          >
            <Pencil className="w-4 h-4" />
            ویرایش
          </Link>
          <Link
            href={`/admin/lists/${row.id}/debug`}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
            onClick={() => setOpen(false)}
          >
            <BarChart3 className="w-4 h-4" />
            دیباگ ترند
          </Link>
          <button
            type="button"
            disabled={featureLoading}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)] disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onFeature();
            }}
          >
            <Star className="w-4 h-4" />
            {row.isFeatured ? 'حذف از ویژه' : 'ویژه کردن'}
          </button>
          <button
            type="button"
            disabled={disableLoading}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)] disabled:opacity-50"
            onClick={() => {
              setOpen(false);
              onDisable();
            }}
          >
            <Power className="w-4 h-4" />
            {row.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
          </button>
          {onMoveToTrash && (
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => {
                setOpen(false);
                onMoveToTrash();
              }}
            >
              <Trash2 className="w-4 h-4" />
              انتقال به زباله‌دان
            </button>
          )}
        </div>
      )}
    </div>
  );
}
