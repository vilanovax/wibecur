'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const MAX_WIDTH_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

interface DesktopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_CLASS;
  zIndex?: number;
  escapeToClose?: boolean;
  closeOnBackdrop?: boolean;
}

export default function DesktopDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  headerAction,
  children,
  footer,
  maxWidth = 'md',
  zIndex = 60,
  escapeToClose = true,
  closeOnBackdrop = true,
}: DesktopDialogProps) {
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

  const dialog = (
    <div
      ref={backdropRef}
      data-theme="paper"
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === backdropRef.current) onClose();
      }}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'desktop-dialog-title' : undefined}
        dir="rtl"
        className={`relative flex w-full ${MAX_WIDTH_CLASS[maxWidth]} max-h-[90vh] flex-col rounded-surface border border-border bg-popover text-popover-foreground shadow-overlay animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle || headerAction) && (
          <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-border px-5 py-4">
            <div className="min-w-0 flex-1 text-start">
              {title && (
                <h2 id="desktop-dialog-title" className="text-base font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="بستن"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-5">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 border-t border-border bg-popover px-4 py-3 lg:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(dialog, document.body);
  }
  return dialog;
}
