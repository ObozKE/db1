/**
 * ==============================================================================
 * Stock Adjuster Component
 * ==============================================================================
 * TYPE: Client Component ("use client")
 *
 * WHY A CLIENT COMPONENT:
 * Requires browser event handlers (`onClick`), local state for loading spinners,
 * and optimistic feedback when invoking the `adjustStock` Server Action.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * Triggers the atomic `$inc` Server Action on the server.
 * If someone tries to decrement past 0, the server rejects it with a friendly error.
 */

"use client";

import * as React from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adjustStock } from "@/app/actions";

interface StockAdjusterProps {
  productId: string;
  currentQuantity: number;
  productName: string;
}

export function StockAdjuster({
  productId,
  currentQuantity,
  productName,
}: StockAdjusterProps) {
  const [isPending, startTransition] = React.useTransition();
  const [pendingChange, setPendingChange] = React.useState<number | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleAdjust = (change: number) => {
    setErrorMsg(null);
    setPendingChange(change);

    startTransition(async () => {
      const response = await adjustStock({
        productId,
        change,
        reason: change > 0 ? "Quick Stock Restock (+1)" : "Quick Stock Deduction (-1)",
      });

      setPendingChange(null);

      if (!response.success && response.message) {
        setErrorMsg(response.message);
        // Clear error after 4 seconds
        setTimeout(() => setErrorMsg(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        {/* Decrement Button (-1) */}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-md text-slate-600 hover:text-red-600 hover:border-red-300"
          onClick={() => handleAdjust(-1)}
          disabled={isPending || currentQuantity <= 0}
          title={`Reduce stock of ${productName} by 1`}
          aria-label={`Decrement stock of ${productName}`}
        >
          {isPending && pendingChange === -1 ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
          ) : (
            <Minus className="h-3.5 w-3.5" />
          )}
        </Button>

        {/* Current Quantity Display */}
        <span className="min-w-[2.5rem] text-center font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
          {currentQuantity}
        </span>

        {/* Increment Button (+1) */}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-md text-slate-600 hover:text-emerald-600 hover:border-emerald-300"
          onClick={() => handleAdjust(1)}
          disabled={isPending}
          title={`Increase stock of ${productName} by 1`}
          aria-label={`Increment stock of ${productName}`}
        >
          {isPending && pendingChange === 1 ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Floating error notification if decrement is disallowed */}
      {errorMsg && (
        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
