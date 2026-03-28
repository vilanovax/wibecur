'use client';

import { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { createPortal } from 'react-dom';
import { X, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Hook that gates an action behind authentication.
 * Instead of hard-redirecting to /login, it shows a bottom sheet
 * so the user doesn't lose their current context.
 *
 * Usage:
 *   const { requireAuth, AuthSheet } = useRequireAuth();
 *   <button onClick={requireAuth(() => doSomething())}>Action</button>
 *   <AuthSheet />
 */
export function useRequireAuth() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const router = useRouter();

  const requireAuth = useCallback(
    (action: () => void) => {
      return (...args: unknown[]) => {
        if (session?.user) {
          action();
        } else {
          pendingAction.current = action;
          setIsOpen(true);
        }
      };
    },
    [session]
  );

  const handleLogin = useCallback(() => {
    setIsOpen(false);
    router.push('/login');
  }, [router]);

  const handleRegister = useCallback(() => {
    setIsOpen(false);
    router.push('/register');
  }, [router]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    pendingAction.current = null;
  }, []);

  function AuthSheet() {
    if (!isOpen) return null;

    const sheet = (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-200" />

        <div
          className="relative bg-white rounded-t-3xl shadow-2xl w-full max-w-2xl animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-8 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Content */}
          <div className="px-6 pt-4 pb-8 text-center" dir="rtl">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-violet-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              برای این کار باید وارد بشی
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              وارد حسابت شو یا یه حساب جدید بساز تا بتونی از همه امکانات استفاده کنی.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all"
              >
                ورود به حساب
              </button>
              <button
                onClick={handleRegister}
                className="w-full py-3 bg-gray-100 text-gray-800 font-semibold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                ساخت حساب جدید
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(sheet, document.body);
    }
    return sheet;
  }

  return { requireAuth, AuthSheet, isAuthenticated: !!session?.user };
}
