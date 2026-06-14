import * as Sentry from '@sentry/react';

const isProduction = process.env.NODE_ENV === 'production';

let monitoringEnabled = false;

/**
 * Initialise client-side error monitoring.
 *
 * No-op unless REACT_APP_SENTRY_DSN is configured, so local development and any
 * deployment without a DSN behave exactly as before. Safe to call once at
 * startup.
 */
export function initMonitoring() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) {
    return;
  }
  try {
    Sentry.init({
      dsn,
      environment: process.env.REACT_APP_SENTRY_ENV || process.env.NODE_ENV,
      release: process.env.REACT_APP_VERSION || undefined,
      // Keep performance tracing light by default; tune via env if needed.
      tracesSampleRate: Number(process.env.REACT_APP_SENTRY_TRACES_RATE || 0),
      // Avoid sending PII (request bodies, tokens) to the error tracker.
      sendDefaultPii: false,
    });
    monitoringEnabled = true;
  } catch (e) {
    // Never let monitoring setup break the app.
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.warn('Sentry init failed:', e);
    }
  }
}

/**
 * Report a caught error to the monitoring backend (when configured).
 */
export function captureException(error, context) {
  if (monitoringEnabled) {
    try {
      Sentry.captureException(error, context ? { extra: context } : undefined);
    } catch {
      /* swallow */
    }
  }
}

/**
 * Console-gated logger. Output is suppressed in production builds so the
 * browser console stays clean; errors are still forwarded to monitoring.
 */
export const logger = {
  debug: (...args) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
  info: (...args) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
  warn: (...args) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
  error: (...args) => {
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.error(...args);
    }
    const err = args.find((a) => a instanceof Error);
    if (err) {
      captureException(err);
    }
  },
};
