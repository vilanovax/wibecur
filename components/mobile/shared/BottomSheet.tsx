'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MOBILE_SHELL_MAX_WIDTH_CLASS } from '@/components/providers/MainContainer';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** اکشن کنار عنوان (مثلاً «همه خوانده») */
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  maxHeight?: string;
  /** محدود به عرض شِل موبایل (۴۲۸px) — پیش‌فرض true */
  constrainToMobileShell?: boolean;
  /** z-index لایه — برای دیالوگ روی شیت دیگر */
  zIndex?: number;
  /** بستن با Escape */
  escapeToClose?: boolean;
  /** بستن با کلیک روی backdrop */
  closeOnBackdrop?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  headerAction,
  children,
  maxHeight = '85vh',
  constrainToMobileShell = true,
  zIndex = 60,
  escapeToClose = true,
  closeOnBackdrop = true,
}: BottomSheetProps) {
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
      if (e.key === 'Escape' && isOpen && escapeToClose) {
        onClose();
      }
    };

    if (isOpen && escapeToClose) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, escapeToClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const widthClass = constrainToMobileShell
    ? `w-full ${MOBILE_SHELL_MAX_WIDTH_CLASS} mx-auto`
    : 'w-full max-w-2xl mx-auto';

  const sheet = (
    <div
      ref={backdropRef}
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex }}
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />

      <div
        ref={sheetRef}
        className={`relative bg-wibe-card rounded-t-2xl shadow-2xl ${widthClass} animate-in slide-in-from-bottom duration-300 flex flex-col`}
        style={{ maxHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-9 h-1 bg-gray-200 rounded-full" />
        </div>

        {(title || subtitle || headerAction) && (
          <div className="flex flex-shrink-0 items-start justify-between gap-2 border-b border-wibe px-2.5 pb-3 pt-1">
            <div className="min-w-0 flex-1 text-right">
              {title && (
                <h2 className="wibe-h3 leading-tight text-foreground">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-0.5 wibe-caption leading-relaxed text-wibe-secondary">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200"
                aria-label="بستن"
              >
                <X className="h-4 w-4 text-wibe-secondary" />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(sheet, document.body);
  }
  return sheet;
}
