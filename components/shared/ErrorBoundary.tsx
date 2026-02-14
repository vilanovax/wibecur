'use client';

import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * کامپوننت Error Boundary برای wrap کردن بخش‌هایی که ممکن است خطا بدهند.
 * اگر خطا رخ دهد، به جای کرش کل صفحه، fallback نمایش داده می‌شود.
 * خطاها به Sentry ارسال می‌شوند (اگر DSN تنظیم شده باشد).
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    this.props.onError?.(error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          className="flex flex-col items-center justify-center p-6 rounded-xl bg-amber-50/50 border border-amber-100"
          dir="rtl"
        >
          <div className="flex justify-center mb-3">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">خطا در بارگذاری</p>
          <p className="text-xs text-gray-500 mb-4">دوباره امتحان کن</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش دوباره
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
