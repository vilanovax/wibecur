'use client';

import { Component, type ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          className="flex flex-col items-center justify-center rounded-surface border border-warning/30 bg-warning/10 p-6"
          dir="rtl"
        >
          <div className="mb-3 flex justify-center">
            <AlertCircle className="size-8 text-warning" />
          </div>
          <p className="mb-1 text-sm font-medium text-foreground">خطا در بارگذاری</p>
          <p className="mb-4 text-xs text-muted-foreground">دوباره امتحان کن</p>
          <Button type="button" variant="brand" size="lg" onClick={this.handleReset}>
            <RefreshCw />
            تلاش دوباره
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
