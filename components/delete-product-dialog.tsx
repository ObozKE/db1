/**
 * ==============================================================================
 * Delete Product Confirmation Modal
 * ==============================================================================
 * TYPE: Client Component ("use client")
 *
 * WHY A CLIENT COMPONENT:
 * Controls the open/close state of the modal dialog, captures user confirmation,
 * and calls the `deleteProduct` Server Action inside a React transition.
 */

"use client";

import * as React from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteProduct } from "@/app/actions";

interface DeleteProductDialogProps {
  productId: string;
  productName: string;
  sku: string;
}

export function DeleteProductDialog({
  productId,
  productName,
  sku,
}: DeleteProductDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleDelete = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const response = await deleteProduct(productId);
      if (response.success) {
        setOpen(false);
      } else {
        setErrorMsg(response.message || "Failed to delete product.");
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
        title={`Delete ${productName}`}
        aria-label={`Delete ${productName}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <div className="mx-auto sm:mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/60 mb-2">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <DialogTitle>Delete Product?</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 dark:text-slate-100">{productName}</strong>{" "}
              (SKU: <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{sku}</code>)?
              This action cannot be undone and will remove the product from MongoDB.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 mb-4 text-xs rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Delete Permanently</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
