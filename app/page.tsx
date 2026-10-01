/**
 * ==============================================================================
 * Dashboard Page (Analytics & Overview)
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * WHY A SERVER COMPONENT:
 * Fetches aggregated statistics directly from MongoDB on the server before
 * generating HTML. No useEffect, no loading spinners after mount, and zero database
 * connection strings or credentials exposed to the client.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * 1. Aggregation Pipeline with `$facet`, `$group`, `$sum`, and `$match`.
 * 2. Left Outer Join using `$lookup` to join `stock_movements` with `products`.
 */

import Link from "next/link";
import { PlusCircle, ArrowRight, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCards } from "@/components/stats-cards";
import { CategoryDistribution } from "@/components/category-distribution";
import { StockBadge } from "@/components/stock-badge";
import { getInventoryStats } from "@/lib/data/stats";
import { getRecentStockMovements, getProducts } from "@/lib/data/products";
import { formatDate } from "@/lib/utils";

// Mark as dynamic so fresh statistics are loaded on navigation/revalidation
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch stats, recent movements, and low stock products concurrently via Promise.all
  const [stats, recentMovements, lowStockResult] = await Promise.all([
    getInventoryStats(),
    getRecentStockMovements(6),
    getProducts({ limit: 5, sortBy: "quantity", sortOrder: "asc" }),
  ]);

  const lowStockProducts = lowStockResult.products.filter(
    (p) => p.quantity <= p.lowStockThreshold
  );

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Inventory Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time analytics powered by MongoDB driver queries and aggregation pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <span>View All Products</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/products/new">
            <Button className="gap-2 shadow-xs">
              <PlusCircle className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics Cards (MongoDB Aggregation Pipeline) */}
      <StatsCards stats={stats} />

      {/* Analytics & Breakdown Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <CategoryDistribution
          categories={stats.categoryDistribution}
          totalValue={stats.totalStockValue}
        />

        {/* Low Stock Attention List */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Low Stock Warnings</span>
                </CardTitle>
                <CardDescription>
                  Products at or below their low-stock safety threshold
                </CardDescription>
              </div>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-xs">
                  Manage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                🎉 All products have healthy stock levels!
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                          {product.sku}
                        </code>
                        <span>&bull;</span>
                        <span>Threshold: {product.lowStockThreshold}</span>
                      </div>
                    </div>
                    <StockBadge
                      quantity={product.quantity}
                      threshold={product.lowStockThreshold}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log / Recent Movements (MongoDB $lookup + sort) */}
      <Card className="shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>Recent Stock Activity (Audit Trail)</span>
              </CardTitle>
              <CardDescription>
                Live log from the <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">stock_movements</code> collection showing every inventory change
              </CardDescription>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Collection: stock_movements
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {recentMovements.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No activity recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Action / Reason</th>
                    <th className="pb-3 text-center">Change</th>
                    <th className="pb-3 text-right">Inventory Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentMovements.map((movement) => (
                    <tr key={movement.id} className="text-xs">
                      <td className="py-2.5 text-slate-500">
                        {formatDate(movement.createdAt)}
                      </td>
                      <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {movement.productName}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">
                        {movement.reason}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`font-semibold font-mono ${
                            movement.change > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : movement.change < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-500"
                          }`}
                        >
                          {movement.change > 0 ? `+${movement.change}` : movement.change}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">
                        {movement.previousQuantity} &rarr; <strong>{movement.newQuantity}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
