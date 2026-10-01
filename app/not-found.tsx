/**
 * ==============================================================================
 * Not Found (404) Page
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * PURPOSE:
 * Rendered when a requested product ID or invalid route does not exist.
 */

import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-4">
        <SearchX className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Record Not Found
      </h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The requested product or resource could not be found in the MongoDB database.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        </Link>
        <Link href="/products">
          <Button>View All Products</Button>
        </Link>
      </div>
    </div>
  );
}
