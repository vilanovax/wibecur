import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

const REPLAY_OPTIONS = {
  maskAllText: true,
  maskAllInputs: true,
  blockAllMedia: true,
} as const;

/**
 * Replay is heavy (~100KB+ gzip). Keep it out of the initial client chunk and
 * only fetch after first interaction (or a long idle fallback) so cold navigations
 * and Lighthouse don't pay for unused Session Replay JS.
 */
function lazyLoadReplay() {
  if (typeof window === 'undefined') return;

  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    cleanup();
    void import('@sentry/nextjs')
      .then((mod) => {
        Sentry.addIntegration(mod.replayIntegration(REPLAY_OPTIONS));
      })
      .catch(() => {
        /* ignore — adblock / offline */
      });
  };

  const onInteract = () => load();
  const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
  for (const event of events) {
    window.addEventListener(event, onInteract, { once: true, passive: true });
  }

  // Sessions with no interaction still get Replay eventually (errors included).
  const fallbackTimer = globalThis.setTimeout(load, 20_000);

  function cleanup() {
    globalThis.clearTimeout(fallbackTimer);
    for (const event of events) {
      window.removeEventListener(event, onInteract);
    }
  }
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
    // Replay loaded lazily below — do not include replayIntegration here.
    integrations: [],
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

  lazyLoadReplay();
}
