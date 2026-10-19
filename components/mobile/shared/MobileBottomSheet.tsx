'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/lib/layout-tokens';

export interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  constrainToMobileShell?: boolean;
  zIndex?: number;
  escapeToClose?: boolean;
  closeOnBackdrop?: boolean;
}

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  headerAction,
  children,
  footer,
  maxHeight = '85vh',
  constrainToMobileShell = true,
  zIndex = 60,
  escapeToClose = true,
  closeOnBackdrop = true,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && escapeToClose) onClose();
    };
    if (isOpen && escapeToClose) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, escapeToClose]);

  if (!isOpen) return null;

  const widthClass = constrainToMobileShell
    ? `w-full ${MOBILE_SHELL_MAX_WIDTH_CLASS} mx-auto`
    : 'w-full max-w-2xl mx-auto';

  const sheet = (
    <div
      ref={backdropRef}
      data-theme="paper"
      className="fixed inset-0 flex items-end justify-center bg-transparent lg:hidden"
      style={{ zIndex }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === backdropRef.current) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200"
        onClick={() => {
          if (closeOnBackdrop) onClose();
        }}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        dir="rtl"
        className={`relative flex flex-col rounded-t-xl border-t border-border bg-popover text-popover-foreground shadow-overlay ${widthClass} animate-in slide-in-from-bottom duration-300`}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-full bg-muted" />
        </div>

        {(title || subtitle || headerAction) && (
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 pb-3 pt-1">
            <div className="min-w-0 flex-1 text-start">
              {title && <h2 className="text-base font-semibold leading-tight text-foreground">{title}</h2>}
              {subtitle && (
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="بستن"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-border bg-popover pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(sheet, document.body);
  }
  return sheet;
}
