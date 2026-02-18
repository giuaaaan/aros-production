// Sentry Client Configuration
// This file configures Sentry for the browser environment

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
    Sentry.httpClientIntegration(),
  ],

  // Filter out specific errors
  ignoreErrors: [
    // Ignore browser extension errors
    /chrome-extension/,
    /extensions\//,
    /^ResizeObserver loop/, // Common false positive
    /^Non-Error promise rejection/, // Often from third-party scripts
  ],

  // Performance monitoring
  tracePropagationTargets: ["localhost", /^https:\/\/your-production-domain\.com/],

  // Environment
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development",

  // Before sending, sanitize sensitive data
  beforeSend(event) {
    // Remove potentially sensitive information
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
      delete event.request.headers["Cookie"];
    }
    return event;
  },
});
