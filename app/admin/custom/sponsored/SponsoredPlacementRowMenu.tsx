'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, Loader2, MoreVertical, Pencil, Power, Trash2 } from 'lucide-react';

type PlacementRowMenuProps = {
  isActive: boolean;
  toggling?: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onPerformance: () => void;
  onDelete: () => void;
};

const MENU_WIDTH = 192;
const MENU_ESTIMATED_HEIGHT = 200;

export default function SponsoredPlacementRowMenu({
  isActive,
  toggling = false,
  onEdit,
  onToggleActive,
  onPerformance,
  onDelete,
}: PlacementRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
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
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4 shrink-0" />
              ویرایش
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={toggling}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:hover:bg-amber-900/20"
              onClick={() => {
                setOpen(false);
                onToggleActive();
              }}
            >
              {toggling ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Power className="h-4 w-4 shrink-0" />
              )}
              {isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              onClick={() => {
                setOpen(false);
                onPerformance();
              }}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              گزارش عملکرد
            </button>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              حذف
            </button>
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
        className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] transition-colors"
        aria-label="منوی عملیات"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}
