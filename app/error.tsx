/**
 * ==============================================================================
 * Global Error Boundary
 * ==============================================================================
 * TYPE: Client Component ("use client")
 *
 * PURPOSE:
 * Next.js catches unhandled runtime errors in Server and Client Components and
 * renders this fallback UI instead of crashing the entire page.
 */

"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-rose-200 dark:border-rose-900 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl text-rose-900 dark:text-rose-100">
            Database or Application Error
          </CardTitle>
          <CardDescription>
            An unexpected error occurred while processing your request or querying MongoDB.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-md font-mono text-xs text-slate-700 dark:text-slate-300 break-words">
            {error.message || "Unknown error occurred"}
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-3">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
