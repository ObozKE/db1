/**
 * ==============================================================================
 * Dashboard Statistics Cards Component
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * PURPOSE:
 * Renders high-level inventory metrics calculated via the MongoDB Aggregation
 * pipeline (`$facet`, `$group`, `$sum`, `$match`).
 */

import { Package, Banknote, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { InventoryStats } from "@/lib/validations";

interface StatsCardsProps {
  stats: InventoryStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total SKUs",
      value: stats.totalProducts.toLocaleString(),
      subtext: `${stats.totalItemsInStock.toLocaleString()} total units in warehouse`,
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      title: "Total Inventory Value",
      value: formatCurrency(stats.totalStockValue),
      subtext: "Calculated via (price × quantity) aggregation in KES",
      icon: Banknote,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount.toString(),
      subtext: "At or below safety threshold",
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/50",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount.toString(),
      subtext: "Zero available inventory units",
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-50 dark:bg-rose-950/50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {card.value}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {card.subtext}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
