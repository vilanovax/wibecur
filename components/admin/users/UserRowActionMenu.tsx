'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { BarChart3, MoreVertical, Power, ShieldCheck } from 'lucide-react';
import type { UserIntelligenceRow } from '@/lib/admin/users-types';

const MENU_WIDTH = 220;
const MENU_ESTIMATED_HEIGHT = 160;

type UserRowActionMenuProps = {
  user: UserIntelligenceRow;
  onToggleActiveRequest: (user: UserIntelligenceRow) => void;
  onUnrestrictCommentRequest?: (user: UserIntelligenceRow) => void;
  togglingId: string | null;
  liftingCommentId?: string | null;
};

function canLiftCommentRestriction(user: UserIntelligenceRow): boolean {
  return (
    user.commentStatus === 'restricted' ||
    user.commentStatus === 'banned' ||
    user.userViolationsCount > 0
  );
}

export default function UserRowActionMenu({
  user,
  onToggleActiveRequest,
  onUnrestrictCommentRequest,
  togglingId,
  liftingCommentId = null,
}: UserRowActionMenuProps) {
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
            className="fixed z-[200] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
            dir="rtl"
          >
            <Link
              href={`/admin/analytics?user=${user.id}`}
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
              onClick={() => setOpen(false)}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              آنالیتیکس
            </Link>
            {canLiftCommentRestriction(user) && onUnrestrictCommentRequest && (
              <button
                type="button"
                role="menuitem"
                disabled={liftingCommentId === user.id}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                onClick={() => {
                  setOpen(false);
                  onUnrestrictCommentRequest(user);
                }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                رفع محدودیت کامنت
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              disabled={togglingId === user.id}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              onClick={() => {
                setOpen(false);
                onToggleActiveRequest(user);
              }}
            >
              <Power className="w-4 h-4 shrink-0" />
              {user.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
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
        className="p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
        aria-label="منوی عملیات"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-4 h-4 text-[var(--color-text-muted)]" />
      </button>
      {menu}
    </>
  );
}
