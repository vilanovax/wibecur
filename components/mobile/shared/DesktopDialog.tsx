'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const MAX_WIDTH_CLASS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

interface DesktopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
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
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === backdropRef.current) onClose();
      }}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'desktop-dialog-title' : undefined}
        dir="rtl"
        className={`relative flex w-full ${MAX_WIDTH_CLASS[maxWidth]} max-h-[90vh] flex-col rounded-2xl bg-wibe-card shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle || headerAction) && (
          <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-wibe px-5 py-4">
            <div className="min-w-0 flex-1 text-right">
              {title && (
                <h2 id="desktop-dialog-title" className="wibe-h3 text-foreground">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 wibe-caption text-wibe-secondary">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="بستن"
              >
                <X className="h-4 w-4 text-wibe-secondary" />
              </button>
            </div>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-hidden p-4 lg:p-5">{children}</div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(dialog, document.body);
  }
  return dialog;
}
