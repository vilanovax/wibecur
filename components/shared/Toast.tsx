'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-amber-600/95 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-500 text-white',
};

export default function Toast({
  message,
  type = 'success',
  duration = 5000,
  onClose,
}: ToastProps) {
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed bottom-6 left-4 right-4 mx-auto z-[100] max-w-md ${toastStyles[type]} rounded-xl shadow-2xl flex items-center gap-3 p-4`}
        style={{ marginLeft: 'auto', marginRight: 'auto' }}
      >
        <Icon className="w-6 h-6 flex-shrink-0" />
        <p className="flex-1 text-sm font-medium pr-2">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="بستن"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

