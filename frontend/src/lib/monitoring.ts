export function initMonitoring() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  // Lightweight scaffold: keeps app dependency-free unless DSN is configured later.
  if (sentryDsn) {
    console.info('[monitoring] Sentry DSN detected. Add @sentry/react init here when enabling Sentry.');
  }

  window.addEventListener('error', (event) => {
    console.error('[frontend:error]', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[frontend:unhandledrejection]', {
      reason: String(event.reason),
    });
  });
}
