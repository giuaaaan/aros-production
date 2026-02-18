"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as Sentry from "@sentry/nextjs";
import { captureError, logInfo, addBreadcrumb } from "@/components/error/sentry-error-boundary";

export default function SentryExamplePage() {
  const handleClientError = () => {
    throw new Error("Sentry Example Client Error");
  };

  const handleServerError = async () => {
    await fetch("/api/sentry-example-api");
  };

  const handleCapturedError = () => {
    try {
      // Simulate an error
      throw new Error("This is a captured error");
    } catch (error) {
      captureError(error, { 
        component: "SentryExamplePage",
        action: "handleCapturedError" 
      });
      alert("Error captured and sent to Sentry!");
    }
  };

  const handleLogInfo = () => {
    logInfo("User clicked log info button", {
      userAction: "test",
      timestamp: new Date().toISOString(),
    });
    alert("Info logged to Sentry!");
  };

  const handleAddBreadcrumb = () => {
    addBreadcrumb(
      "User navigated to test section",
      "navigation",
      "info"
    );
    alert("Breadcrumb added!");
  };

  const handleSetUser = () => {
    Sentry.setUser({
      id: "123",
      email: "test@example.com",
      username: "testuser",
    });
    alert("User context set!");
  };

  const handleClearUser = () => {
    Sentry.setUser(null);
    alert("User context cleared!");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sentry Testing Page</h1>
      <p className="text-muted-foreground">
        Use this page to test Sentry error monitoring and performance tracking.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Error Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={handleClientError} 
              variant="destructive"
              className="w-full"
            >
              Throw Client Error
            </Button>
            <Button 
              onClick={handleServerError} 
              variant="destructive"
              className="w-full"
            >
              Trigger Server Error
            </Button>
            <Button 
              onClick={handleCapturedError}
              className="w-full"
            >
              Capture Error Manually
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logging & Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={handleLogInfo}
              variant="outline"
              className="w-full"
            >
              Log Info Message
            </Button>
            <Button 
              onClick={handleAddBreadcrumb}
              variant="outline"
              className="w-full"
            >
              Add Breadcrumb
            </Button>
            <Button 
              onClick={handleSetUser}
              variant="outline"
              className="w-full"
            >
              Set User Context
            </Button>
            <Button 
              onClick={handleClearUser}
              variant="outline"
              className="w-full"
            >
              Clear User Context
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sentry Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(
              {
                dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ? "[CONFIGURED]" : "[NOT SET]",
                environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
                release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
