"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SentryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
      tags: {
        errorBoundary: "true",
      },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        this.props.fallback || (
          <div className="min-h-[400px] flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-gray-600 max-w-md">
                We&apos;ve been notified and are working to fix the issue. Please try
                refreshing the page.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <pre className="text-left bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-w-lg">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              )}
              <div className="flex justify-center gap-3">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Hook per catturare errori nelle funzioni
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof Error) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    Sentry.captureMessage(String(error), {
      level: "error",
      extra: context,
    });
  }
}

// Utility per loggare informazioni
export function logInfo(message: string, context?: Record<string, unknown>) {
  Sentry.captureMessage(message, {
    level: "info",
    extra: context,
  });
}

// Utility per breadcrumb
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
  });
}
