import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection captured',
      /Loading chunk \d+ failed/,
      /ChunkLoadError/,
    ],
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const msg = String((error as Error).message);
        if (msg.includes('Hydration') || msg.includes('hydration')) return null;
      }
      return event;
    },
  });
}
