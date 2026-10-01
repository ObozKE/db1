/**
 * ==============================================================================
 * Zod Validation Schemas & TypeScript Data Models
 * ==============================================================================
 * This file defines the data contracts and validation rules for our Inventory system.
 *
 * WHY VALIDATION MATTERS:
 * Validating incoming data on the server prevents corrupted records, SQL/NoSQL injection,
 * negative inventory states, and invalid data types from ever entering MongoDB.
 *
 * ZOD FEATURES:
 * - Runtime parsing and type coercion (e.g., converting form string values into numbers).
 * - Automatic TypeScript type inference (`z.infer<typeof Schema>`).
 * - Clear, user-friendly error messages that can be displayed next to form inputs.
 */

import { z } from "zod";

/**
 * Validation schema for creating or editing a Product document.
 *
 * Used in Server Actions before inserting or updating data in MongoDB.
 */
export const ProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters long")
    .max(100, "Product name cannot exceed 100 characters"),

  sku: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "SKU must be at least 3 characters long")
    .max(30, "SKU cannot exceed 30 characters")
    .regex(/^[A-Z0-9\-_]+$/, "SKU may only contain uppercase letters, numbers, hyphens, and underscores"),

  category: z
    .string()
    .trim()
    .min(2, "Category must be at least 2 characters long")
    .max(50, "Category cannot exceed 50 characters"),

  // ===========================================================================
  // [LEARNING DEMO: NEW FIELD] To enable the 'supplier' field, uncomment below:
  // supplier: z.string().trim().min(2, "Supplier name must be at least 2 characters").max(100).optional(),
  // ===========================================================================

  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),

  price: z.coerce
    .number()
    .min(1, "Price must be at least KES 1")
    .max(100000000, "Price cannot exceed KES 100,000,000"),

  lowStockThreshold: z.coerce
    .number()
    .int("Threshold must be a whole number")
    .min(0, "Threshold cannot be negative")
    .default(5),
});

/**
 * Validation schema for atomic stock adjustments (incrementing or decrementing inventory).
 */
export const StockAdjustmentSchema = z.object({
  productId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),

  change: z.coerce
    .number()
    .int("Adjustment amount must be a whole integer")
    .refine((val) => val !== 0, "Stock change cannot be zero"),

  reason: z
    .string()
    .trim()
    .min(2, "Reason must be at least 2 characters long")
    .max(100, "Reason cannot exceed 100 characters")
    .default("Manual Adjustment"),
});

// TypeScript type inferred directly from the Zod ProductSchema
export type ProductInput = z.infer<typeof ProductSchema>;

// TypeScript type inferred directly from the Zod StockAdjustmentSchema
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

/**
 * Represents a Product document as stored in MongoDB.
 * The `_id` is represented as a string for safe serialization across Server and Client Components.
 */
export interface Product {
  id: string; // Serialized MongoDB _id (24 hex characters)
  name: string;
  sku: string;
  category: string;
  // supplier?: string; // [LEARNING DEMO: NEW FIELD] Uncomment to include in Product interface
  quantity: number;
  price: number;
  lowStockThreshold: number;
  createdAt: string; // Serialized ISO string
  updatedAt: string; // Serialized ISO string
}

/**
 * Represents an entry in the `stock_movements` audit log collection.
 */
export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  change: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  createdAt: string;
}

/**
 * Represents summary statistics aggregated from MongoDB.
 */
export interface InventoryStats {
  totalProducts: number;
  totalItemsInStock: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryDistribution: {
    category: string;
    count: number;
    totalQuantity: number;
    totalValue: number;
  }[];
}


/* File 1: lib/validations.ts (Validation & Types)
Purpose: Tells Zod and TypeScript that supplier is a valid product field.
Lines to uncomment:
Inside ProductSchema:
typescript
// supplier: z.string().trim().min(2, "Supplier name must be at least 2 characters").max(100).optional(),
Inside export interface Product:
typescript
// supplier?: string;
File 2: app/actions.ts (Backend Database Mutations)
Purpose: Writes the new field into MongoDB when creating or updating a product.
Lines to uncomment:
In createProduct() (insertOne):
typescript
// supplier: (data as any).supplier || undefined,
In updateProduct() (updateOne with $set):
typescript
// supplier: (data as any).supplier || undefined,
File 3: lib/data/products.ts (Backend Database Reads)
Purpose: Reads supplier from the raw MongoDB document and returns it to Server Components.
Lines to uncomment: Inside formatProductDocument(doc):
typescript
// supplier: doc.supplier ? String(doc.supplier) : undefined,
File 4: components/product-form.tsx (Frontend Input Form)
Purpose: Adds an interactive input field for Supplier to both Create and Edit pages.
Lines to uncomment:
In the formData state:
typescript
// supplier: (initialData as any)?.supplier || "",
In the JSX form layout (under Category):
tsx
{/* <div className="space-y-1.5">
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
    </div> 
File 5: components/product-table.tsx (Frontend Table Display)
Purpose: Displays the vendor name under the product name in the inventory table.
Lines to uncomment: Inside the product name table cell:
tsx
{/* {(product as any).supplier && (
      <span className="text-xs text-slate-500 font-medium">
        Vendor: {(product as any).supplier}
      </span>
    )} *
File 6: scripts/seed.ts (Database Seeder)
Purpose: Allows seeding sample products with suppliers from the command line.
Lines to uncomment:
Inside interface SeedProduct:
typescript
// supplier?: string;
Inside productsCollection.insertOne(...):
typescript
// supplier: (item as any).supplier || undefined, */