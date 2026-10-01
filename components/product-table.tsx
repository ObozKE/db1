/**
 * ==============================================================================
 * Product Table Component
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * WHY A SERVER COMPONENT:
 * Renders the tabular layout directly on the server from raw data without needing
 * client hydration. It embeds small leaf Client Components (`StockAdjuster` and
 * `DeleteProductDialog`) only where browser interaction is needed.
 */

import Link from "next/link";
import { Edit, PackageX, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockBadge } from "@/components/stock-badge";
import { StockAdjuster } from "@/components/stock-adjuster";
import { DeleteProductDialog } from "@/components/delete-product-dialog";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/validations";

interface ProductTableProps {
  products: Product[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function ProductTable({
  products,
  total,
  currentPage,
  totalPages,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-4">
          <PackageX className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          No products match your criteria
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          Try clearing your search query or selecting a different category filter.
        </p>
        <Link href="/products/new" className="mt-4">
          <Button size="sm">Create New Product</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Product Name</TableHead>
              <TableHead className="w-[15%]">SKU</TableHead>
              <TableHead className="w-[15%]">Category</TableHead>
              <TableHead className="w-[12%]">Price</TableHead>
              <TableHead className="w-[15%]">Quick Stock (+/-)</TableHead>
              <TableHead className="w-[13%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                {/* Product Name & Status Badge */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900">
                      {product.name}
                    </span>
                    
                    {/* =========================================================================
                        [LEARNING DEMO: NEW FIELD] To display the Supplier under the product name,
                        uncomment the block below:
                        {(product as any).supplier && (
                          <span className="text-xs text-slate-500 font-medium">
                            Vendor: {(product as any).supplier}
                          </span>
                        )}
                       ========================================================================= */}

                    <div className="mt-1 flex items-center gap-2">
                      <StockBadge
                        quantity={product.quantity}
                        threshold={product.lowStockThreshold}
                      />
                    </div>
                  </div>
                </TableCell>

                {/* SKU */}
                <TableCell>
                  <code className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {product.sku}
                  </code>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <Badge variant="outline" className="font-medium text-xs">
                    {product.category}
                  </Badge>
                </TableCell>

                {/* Price */}
                <TableCell>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(product.price)}
                  </span>
                </TableCell>

                {/* Atomic Stock Adjuster (+ / -) */}
                <TableCell>
                  <StockAdjuster
                    productId={product.id}
                    currentQuantity={product.quantity}
                    productName={product.name}
                  />
                </TableCell>

                {/* Actions: Edit & Delete */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Edit Button */}
                    <Link href={`/products/${product.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        title={`Edit ${product.name}`}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>

                    {/* Delete Confirmation Modal */}
                    <DeleteProductDialog
                      productId={product.id}
                      productName={product.name}
                      sku={product.sku}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination & Summary Bar */}
      <div className="flex items-center justify-between px-2 text-sm text-slate-500">
        <div>
          Showing <strong>{products.length}</strong> of <strong>{total}</strong> products
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Link
              href={`/products?page=${Math.max(1, currentPage - 1)}`}
              className={currentPage <= 1 ? "pointer-events-none opacity-40" : ""}
            >
              <Button variant="outline" size="sm" disabled={currentPage <= 1} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
              </Button>
            </Link>

            <span className="text-xs font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <Link
              href={`/products?page=${Math.min(totalPages, currentPage + 1)}`}
              className={currentPage >= totalPages ? "pointer-events-none opacity-40" : ""}
            >
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} className="gap-1">
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
