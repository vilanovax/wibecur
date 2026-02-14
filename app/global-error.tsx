'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            اوپس! یه چیزی درست پیش نرفت
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            لطفاً دوباره امتحان کن
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            تلاش دوباره
          </button>
          <a
            href="/"
            style={{
              display: 'block',
              marginTop: '1rem',
              color: '#6366F1',
              textDecoration: 'none',
            }}
          >
            بازگشت به خانه
          </a>
        </div>
      </body>
    </html>
  );
}
