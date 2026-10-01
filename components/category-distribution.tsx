/**
 * ==============================================================================
 * Category Distribution Component
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * PURPOSE:
 * Displays inventory valuation and unit breakdown grouped by product category,
 * demonstrating the output of MongoDB's `$group` pipeline stage.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { InventoryStats } from "@/lib/validations";

interface CategoryDistributionProps {
  categories: InventoryStats["categoryDistribution"];
  totalValue: number;
}

export function CategoryDistribution({ categories, totalValue }: CategoryDistributionProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Stock Valuation by Category</CardTitle>
        <CardDescription>
          Computed via MongoDB Aggregation Pipeline (<code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">$group: &#123; _id: &quot;$category&quot; &#125;</code>)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No categories found.</p>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => {
              const percentage = totalValue > 0 ? Math.round((cat.totalValue / totalValue) * 100) : 0;
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {cat.category}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        {cat.count} SKUs ({cat.totalQuantity} units)
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(cat.totalValue)}
                      </span>
                    </div>
                  </div>
                  {/* Visual progress bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
