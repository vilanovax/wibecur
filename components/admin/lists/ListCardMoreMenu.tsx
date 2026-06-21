'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

const MENU_WIDTH = 192;
const MENU_ESTIMATED_HEIGHT = 240;

export default function ListCardMoreMenu({
  row,
  onFeature,
  onDisable,
  onMoveToTrash,
  featureLoading,
  disableLoading,
}: ListCardMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let left = rect.left;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - MENU_WIDTH - 8);
    }

    let top = rect.bottom + 4;
    if (top + MENU_ESTIMATED_HEIGHT > window.innerHeight - 8) {
      top = Math.max(8, rect.top - MENU_ESTIMATED_HEIGHT - 4);
    }

    setMenuPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    if (!open) return;
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const menu =
    open && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[200] w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
            dir="rtl"
          >
            <Link
              href={`/admin/lists/${row.id}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
              onClick={() => setOpen(false)}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              ویرایش
            </Link>
            <Link
              href={`/admin/lists/${row.id}/debug`}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)]"
              onClick={() => setOpen(false)}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              دیباگ ترند
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={featureLoading}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)] disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                onFeature();
              }}
            >
              <Star className="h-4 w-4 shrink-0" />
              {row.isFeatured ? 'حذف از ویژه' : 'ویژه کردن'}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={disableLoading}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-bg)] disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                onDisable();
              }}
            >
              <Power className="h-4 w-4 shrink-0" />
              {row.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
            </button>
            {onMoveToTrash && (
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  setOpen(false);
                  onMoveToTrash();
                }}
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                انتقال به زباله‌دان
              </button>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-xl border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
        aria-label="عملیات بیشتر"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}
