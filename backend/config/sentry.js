const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

const initSentry = () => {
  // Only initialize in production
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      
      integrations: [
        nodeProfilingIntegration(),
      ],
      
      // Performance Monitoring
      tracesSampleRate: 1.0,
      
      // Profiling
      profilesSampleRate: 1.0,
      
      // Environment
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: process.env.npm_package_version || '1.0.0',
      
      // Additional options
      debug: false,
      
      // Error filtering
      beforeSend(event) {
        // Don't send events in development
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    });
  }
};

// Error handler middleware
const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all 4xx and 5xx errors
      return error.status >= 400;
    },
  });
};

// Request handler middleware
const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

// Tracing handler middleware  
const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

module.exports = {
  initSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
  Sentry
};
