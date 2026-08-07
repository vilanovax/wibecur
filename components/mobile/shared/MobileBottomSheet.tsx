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
      className="fixed inset-0 flex items-end justify-center lg:hidden"
      style={{ zIndex }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === backdropRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />

      <div
        ref={sheetRef}
        dir="rtl"
        className={`relative flex flex-col rounded-t-2xl bg-wibe-card shadow-2xl ${widthClass} animate-in slide-in-from-bottom duration-300`}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-full bg-wibe-surface" />
        </div>

        {(title || subtitle || headerAction) && (
          <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-wibe px-2.5 pb-3 pt-1">
            <div className="min-w-0 flex-1 text-right">
              {title && <h2 className="wibe-h3 leading-tight text-foreground">{title}</h2>}
              {subtitle && (
                <p className="mt-0.5 wibe-caption leading-relaxed text-wibe-secondary">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-wibe-surface active:bg-wibe-surface"
                aria-label="بستن"
              >
                <X className="h-4 w-4 text-wibe-secondary" />
              </button>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-wibe bg-wibe-card pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
