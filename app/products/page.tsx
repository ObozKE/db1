/**
 * ==============================================================================
 * Product Listing & Inventory Management Page
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * WHY A SERVER COMPONENT:
 * Reads `searchParams` asynchronously (using `await searchParams` compliant with
 * the latest Next.js App Router rules), queries MongoDB directly on the server,
 * and delivers pre-rendered HTML to the browser.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * 1. Filter with `$regex` (case-insensitive search by name or SKU).
 * 2. Category matching filter.
 * 3. Sorting and pagination with `skip()` and `limit()`.
 * 4. `distinct("category")` to populate filter options.
 */

import Link from "next/link";
import { PlusCircle, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductFilters } from "@/components/product-filters";
import { ProductTable } from "@/components/product-table";
import { getProducts, getCategories } from "@/lib/data/products";

// Ensure page reflects live database mutations immediately upon revalidatePath
export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    page?: string;
    sortBy?: "name" | "sku" | "category" | "quantity" | "price" | "createdAt";
    sortOrder?: "asc" | "desc";
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // In Next.js 15+, searchParams is a Promise that must be awaited
  const resolvedParams = await searchParams;

  const query = resolvedParams.query || "";
  const category = resolvedParams.category || "";
  const page = parseInt(resolvedParams.page || "1", 10) || 1;
  const sortBy = resolvedParams.sortBy || "createdAt";
  const sortOrder = resolvedParams.sortOrder || "desc";

  // Fetch products matching filters and distinct categories in parallel
  const [productsResult, categories] = await Promise.all([
    getProducts({
      query,
      category,
      page,
      limit: 10,
      sortBy,
      sortOrder,
    }),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Boxes className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Product Inventory
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Search, filter, edit, and adjust warehouse stock with atomic MongoDB operations.
          </p>
        </div>

        <Link href="/products/new">
          <Button className="gap-2 shadow-xs">
            <PlusCircle className="h-4 w-4" />
            <span>Add Product</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar (Client Component syncing URL search params) */}
      <ProductFilters categories={categories} />

      {/* Product List Table (Server Component wrapping leaf adjusters and dialogs) */}
      <ProductTable
        products={productsResult.products}
        total={productsResult.total}
        currentPage={productsResult.page}
        totalPages={productsResult.totalPages}
      />
    </div>
  );
}
