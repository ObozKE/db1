/**
 * ==============================================================================
 * Global Loading Skeleton
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * PURPOSE:
 * Next.js automatically streams this loading skeleton instantly while async
 * Server Components are querying MongoDB. This prevents white screens and provides
 * a smooth loading state.
 */

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
          >
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
            <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">
          Loading MongoDB data...
        </p>
      </div>
    </div>
  );
}
