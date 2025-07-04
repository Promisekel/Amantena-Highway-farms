import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

const initSentry = () => {
  // Only initialize in production
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 1.0,
      
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Environment
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: process.env.REACT_APP_VERSION || '1.0.0',
      
      // Error filtering
      beforeSend(event) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
      
      // Additional options
      debug: false,
      autoSessionTracking: true,
    });
  }
};

export default initSentry;
