/**
 * ==============================================================================
 * Product Search & Category Filters
 * ==============================================================================
 * TYPE: Client Component ("use client")
 *
 * WHY A CLIENT COMPONENT:
 * Listens to input typing and select dropdown changes, synchronizing the filter
 * state directly with the browser's URL search parameters (`?query=...&category=...`).
 *
 * WHY URL SEARCH PARAMS ARE BEST PRACTICE:
 * Storing filter state in the URL makes searches shareable, bookmarkable, and
 * preserves filter states across browser refreshes, while allowing Server Components
 * to read `searchParams` directly during page rendering.
 */

"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProductFiltersProps {
  categories: string[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current parameters from URL
  const currentQuery = searchParams.get("query") || "";
  const currentCategory = searchParams.get("category") || "ALL";

  const [searchTerm, setSearchTerm] = React.useState(currentQuery);
  const [prevQuery, setPrevQuery] = React.useState(currentQuery);

  // Sync state if URL query changes externally without triggering cascading effect renders
  if (prevQuery !== currentQuery) {
    setPrevQuery(currentQuery);
    setSearchTerm(currentQuery);
  }

  // Helper to push updated search parameters to the URL
  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset pagination to page 1 whenever filters change
    params.delete("page");

    for (const [key, value] of Object.entries(newParams)) {
      if (value === null || value === "" || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ query: searchTerm });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(currentQuery || (currentCategory && currentCategory !== "ALL"));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                updateParams({ query: null });
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" size="sm" variant="secondary" className="h-9">
          Search
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-[160px]">
          <Filter className="h-4 w-4 text-slate-500 shrink-0" />
          <Select
            value={currentCategory}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="h-9 text-xs sm:text-sm"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
