/**
 * ==============================================================================
 * Stock Status Badge Component
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * PURPOSE:
 * Displays clear visual indicator tags for product inventory status:
 * - "Out of Stock" (Red) when quantity is 0 or less
 * - "Low Stock" (Amber) when quantity is between 1 and the lowStockThreshold
 * - "In Stock" (Green) when quantity is above the lowStockThreshold
 */

import { Badge } from "@/components/ui/badge";

interface StockBadgeProps {
  quantity: number;
  threshold?: number;
}

export function StockBadge({ quantity, threshold = 5 }: StockBadgeProps) {
  if (quantity <= 0) {
    return (
      <Badge variant="destructive" className="font-medium gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        Out of Stock
      </Badge>
    );
  }

  if (quantity <= threshold) {
    return (
      <Badge variant="warning" className="font-medium gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Low Stock ({quantity})
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="font-medium gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      In Stock ({quantity})
    </Badge>
  );
}
