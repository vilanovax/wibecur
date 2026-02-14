import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('نمایش children وقتی خطا نداریم', () => {
    render(
      <ErrorBoundary>
        <div>محتوا</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('محتوا')).toBeInTheDocument();
  });

  it('نمایش fallback هنگام خطا', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('خطا در بارگذاری')).toBeInTheDocument();
    expect(screen.getByText('دوباره امتحان کن')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /تلاش دوباره/ })).toBeInTheDocument();
  });

  it('نمایش fallback سفارشی هنگام خطا', () => {
    render(
      <ErrorBoundary fallback={<div>خطای سفارشی</div>}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('خطای سفارشی')).toBeInTheDocument();
  });

  it('فراخوانی onError هنگام خطا', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
