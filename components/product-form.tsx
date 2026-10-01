/**
 * ==============================================================================
 * Product Form Component (Create & Edit)
 * ==============================================================================
 * TYPE: Client Component ("use client")
 *
 * WHY A CLIENT COMPONENT:
 * Handles live input typing, client-side input formatting (auto-uppercasing SKU),
 * interactive error display, and server action invocation inside `useTransition`.
 *
 * SERVER ACTION INTEGRATION:
 * When submitted, this component passes form data directly to `createProduct` or
 * `updateProduct`. If MongoDB detects a duplicate SKU error (Error 11000) or Zod
 * catches invalid numbers, the server returns structured error messages which this
 * form renders directly below each corresponding input field.
 */

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createProduct, updateProduct } from "@/app/actions";
import { Product, ProductInput } from "@/lib/validations";

interface ProductFormProps {
  initialData?: Product;
  isEditing?: boolean;
}

export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // Form state initialized with existing data if editing
  const [formData, setFormData] = React.useState<ProductInput>({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    category: initialData?.category || "",
    // supplier: (initialData as any)?.supplier || "", // [LEARNING DEMO: NEW FIELD] Uncomment to initialize supplier
    quantity: initialData?.quantity ?? 10,
    price: initialData?.price ?? 2500,
    lowStockThreshold: initialData?.lowStockThreshold ?? 5,
  });

  // Validation errors returned from server or local checks
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? 0
            : Number(value)
          : name === "sku"
          ? value.toUpperCase()
          : value,
    }));

    // Clear specific field error when user starts typing again
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      let response;

      if (isEditing && initialData?.id) {
        response = await updateProduct(initialData.id, formData);
      } else {
        response = await createProduct(formData);
      }

      if (response.success) {
        router.push("/products");
        router.refresh();
      } else {
        setFormError(response.message || "An error occurred while saving the product.");
        if (response.errors) {
          setFieldErrors(response.errors);
        }
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/products" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isEditing ? "Edit Mode" : "New Inventory Item"}
          </span>
        </div>
        <CardTitle className="text-2xl">
          {isEditing ? `Edit: ${initialData?.name}` : "Create New Product"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update product pricing, stock count, and category metadata in MongoDB."
            : "Enter product details to add a new inventory document to the database."}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {/* General Error Banner */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Failed</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Product Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Product Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder='e.g., Wireless Mechanical Keyboard'
              value={formData.name}
              onChange={handleChange}
              disabled={isPending}
              required
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* SKU & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU */}
            <div className="space-y-1.5">
              <label htmlFor="sku" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Stock Keeping Unit (SKU) <span className="text-red-500">*</span>
              </label>
              <Input
                id="sku"
                name="sku"
                type="text"
                placeholder="e.g., ELEC-KEY-001"
                value={formData.sku}
                onChange={handleChange}
                disabled={isPending}
                className="font-mono"
                required
              />
              <p className="text-[11px] text-slate-500">Must be unique (enforced by MongoDB unique index)</p>
              {fieldErrors.sku && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.sku[0]}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Category <span className="text-red-500">*</span>
              </label>
              <Input
                id="category"
                name="category"
                type="text"
                placeholder="e.g., Electronics, Furniture, Audio"
                value={formData.category}
                onChange={handleChange}
                disabled={isPending}
                required
              />
              {fieldErrors.category && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.category[0]}
                </p>
              )}
            </div>
          </div>

          {/* =========================================================================
              [LEARNING DEMO: NEW FIELD] To show the Supplier input in the form, uncomment below:
              <div className="space-y-1.5">
                <label htmlFor="supplier" className="text-sm font-semibold text-slate-800">
                  Supplier / Vendor Name
                </label>
                <Input
                  id="supplier"
                  name="supplier"
                  type="text"
                  placeholder="e.g., Nairobi Hardware Ltd"
                  value={(formData as any).supplier || ""}
                  onChange={handleChange}
                  disabled={isPending}
                />
                {fieldErrors.supplier && (
                  <p className="text-xs text-rose-600 font-medium">
                    {fieldErrors.supplier[0]}
                  </p>
                )}
              </div>
             ========================================================================= */}

          {/* Price, Quantity, Low Stock Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Price (KES) */}
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Unit Price (KES) <span className="text-red-500">*</span>
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                step="any"
                min="1"
                placeholder="2500"
                value={formData.price}
                onChange={handleChange}
                disabled={isPending}
                required
              />
              {fieldErrors.price && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.price[0]}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label htmlFor="quantity" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Quantity in Stock <span className="text-red-500">*</span>
              </label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="1"
                min="0"
                placeholder="10"
                value={formData.quantity}
                onChange={handleChange}
                disabled={isPending}
                required
              />
              {fieldErrors.quantity && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.quantity[0]}
                </p>
              )}
            </div>

            {/* Low Stock Threshold */}
            <div className="space-y-1.5">
              <label htmlFor="lowStockThreshold" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Low Stock Alert Threshold
              </label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                step="1"
                min="0"
                placeholder="5"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                disabled={isPending}
              />
              {fieldErrors.lowStockThreshold && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {fieldErrors.lowStockThreshold[0]}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
          <Link href="/products">
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEditing ? "Save Changes" : "Create Product"}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
