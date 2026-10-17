'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  className?: string;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'bg-success text-white',
  error: 'bg-destructive text-white',
  warning: 'bg-warning text-foreground',
  info: 'bg-primary text-primary-foreground',
};

/**
 * CSS transition enter — avoids pulling framer-motion into shared/prefetched routes.
 */
export default function Toast({
  message,
  type = 'success',
  duration = 5000,
  onClose,
  className = '',
}: ToastProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const Icon = toastIcons[type];

  return (
    <div
      role="status"
      data-theme="paper"
      className={`fixed inset-x-4 bottom-6 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl p-4 shadow-overlay transition duration-300 ease-out motion-reduce:transition-none ${toastStyles[type]} ${
        entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-5 scale-95 opacity-0'
      } ${className}`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/20"
        aria-label="بستن"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
