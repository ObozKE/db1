/**
 * ==============================================================================
 * Server Actions: Database Mutations & Audit Logging
 * ==============================================================================
 * This file contains all MUTATION operations (Create, Update, Delete, Adjust Stock).
 *
 * HOW SERVER ACTIONS WORK IN NEXT.JS APP ROUTER:
 * 1. Client triggers action (e.g. form submission or button click).
 * 2. Next.js securely calls this server-side async function via an internal POST request.
 * 3. The server runs Zod validation and executes MongoDB driver commands (`insertOne`,
 *    `updateOne` with `$set` or `$inc`, `deleteOne`).
 * 4. We call `revalidatePath(...)` to purge cached HTML/RSC payloads, causing Next.js
 *    to automatically re-render and deliver fresh data to the user without a full page reload.
 *
 * ATOMIC UPDATES & PREVENTING RACE CONDITIONS:
 * When adjusting stock, we NEVER do:
 *   let prod = await findOne(...);
 *   prod.quantity += change;
 *   await updateOne(..., { $set: { quantity: prod.quantity } });
 * (That pattern creates a race condition where two simultaneous checkouts could sell the same item!)
 * Instead, we use MongoDB's atomic `$inc` operator combined with a query filter condition
 * (`quantity: { $gte: amount }`) to guarantee atomicity at the database level.
 */

"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import {
  ProductSchema,
  StockAdjustmentSchema,
  ProductInput,
} from "@/lib/validations";

export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Creates a new product and records an initial stock movement in the audit log.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * - `insertOne`: Inserts a single document into the `products` collection.
 * - Error Handling: Catches MongoDB Error Code 11000 (Duplicate Key Error)
 *   triggered if the unique SKU index is violated.
 *
 * @param input - Raw product data from form submission
 * @returns ActionResponse with success status and inserted product ID
 */
export async function createProduct(input: ProductInput): Promise<ActionResponse<{ id: string }>> {
  // Step 1: Validate input fields on the server with Zod
  const validationResult = ProductSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Validation failed. Please check the highlighted fields.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const data = validationResult.data;
  const db = await getDatabase();
  const now = new Date();

  try {
    // Step 2: Insert the product document into the `products` collection
    const result = await db.collection("products").insertOne({
      name: data.name,
      sku: data.sku,
      category: data.category,
      // supplier: (data as any).supplier || undefined, // [LEARNING DEMO: NEW FIELD] Uncomment to store supplier in MongoDB
      quantity: data.quantity,
      price: data.price,
      lowStockThreshold: data.lowStockThreshold,
      createdAt: now,
      updatedAt: now,
    });

    const newProductId = result.insertedId;

    // Step 3: Record the initial stock state in the `stock_movements` audit collection
    if (data.quantity > 0) {
      await db.collection("stock_movements").insertOne({
        productId: newProductId,
        change: data.quantity,
        previousQuantity: 0,
        newQuantity: data.quantity,
        reason: "Initial Inventory Creation",
        createdAt: now,
      });
    }

    // Step 4: Revalidate Next.js cache so the new product appears on dashboard and list immediately
    revalidatePath("/");
    revalidatePath("/products");

    return {
      success: true,
      message: `Product "${data.name}" created successfully.`,
      data: { id: newProductId.toString() },
    };
  } catch (error: unknown) {
    // MongoDB error code 11000 represents a unique index violation (e.g. duplicate SKU)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any)?.code === 11000) {
      return {
        success: false,
        message: `A product with SKU "${data.sku}" already exists. SKUs must be unique.`,
        errors: { sku: [`SKU "${data.sku}" is already in use.`] },
      };
    }

    console.error("Failed to create product:", error);
    return {
      success: false,
      message: "An unexpected database error occurred while creating the product.",
    };
  }
}

/**
 * Updates an existing product document using `$set`.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * - `updateOne({ _id: new ObjectId(id) }, { $set: updates })`
 * - `$set`: Selectively updates only the fields specified without overwriting
 *   unspecified fields or subdocuments.
 *
 * @param id - MongoDB ObjectId string
 * @param input - Updated product fields
 * @returns ActionResponse
 */
export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<ActionResponse> {
  if (!ObjectId.isValid(id)) {
    return { success: false, message: "Invalid product ID format." };
  }

  // Step 1: Validate input fields
  const validationResult = ProductSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Validation failed. Please check the fields.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const data = validationResult.data;
  const db = await getDatabase();
  const productObjectId = new ObjectId(id);

  try {
    // Step 2: Fetch the current document to check if quantity was manually altered in the edit form
    const existing = await db.collection("products").findOne({ _id: productObjectId });
    if (!existing) {
      return { success: false, message: "Product not found." };
    }

    const previousQuantity = Number(existing.quantity);
    const quantityDifference = data.quantity - previousQuantity;
    const now = new Date();

    // Step 3: Update the product in MongoDB using `$set`
    const updateResult = await db.collection("products").updateOne(
      { _id: productObjectId },
      {
        $set: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          // supplier: (data as any).supplier || undefined, // [LEARNING DEMO: NEW FIELD] Uncomment to update supplier in MongoDB
          quantity: data.quantity,
          price: data.price,
          lowStockThreshold: data.lowStockThreshold,
          updatedAt: now,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return { success: false, message: "Product not found or has been removed." };
    }

    // Step 4: If the edit altered the quantity, record an audit entry
    if (quantityDifference !== 0) {
      await db.collection("stock_movements").insertOne({
        productId: productObjectId,
        change: quantityDifference,
        previousQuantity,
        newQuantity: data.quantity,
        reason: "Manual Edit Update",
        createdAt: now,
      });
    }

    // Step 5: Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath(`/products/${id}/edit`);

    return {
      success: true,
      message: `Product "${data.name}" updated successfully.`,
    };
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any)?.code === 11000) {
      return {
        success: false,
        message: `Another product already uses the SKU "${data.sku}".`,
        errors: { sku: [`SKU "${data.sku}" is already in use.`] },
      };
    }

    console.error("Failed to update product:", error);
    return {
      success: false,
      message: "Database error occurred while updating the product.",
    };
  }
}

/**
 * Deletes a product from the database.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * - `deleteOne({ _id: new ObjectId(id) })`: Removes the target document.
 *
 * @param id - MongoDB ObjectId string
 * @returns ActionResponse
 */
export async function deleteProduct(id: string): Promise<ActionResponse> {
  if (!ObjectId.isValid(id)) {
    return { success: false, message: "Invalid product ID format." };
  }

  const db = await getDatabase();
  const productObjectId = new ObjectId(id);

  try {
    // Step 1: Find product name for user-friendly feedback
    const product = await db.collection("products").findOne({ _id: productObjectId });
    if (!product) {
      return { success: false, message: "Product does not exist or was already deleted." };
    }

    // Step 2: Delete the product document
    await db.collection("products").deleteOne({ _id: productObjectId });

    // Step 3: Record deletion in audit log
    await db.collection("stock_movements").insertOne({
      productId: productObjectId,
      change: -Number(product.quantity),
      previousQuantity: Number(product.quantity),
      newQuantity: 0,
      reason: "Product Deleted",
      createdAt: new Date(),
    });

    // Step 4: Revalidate pages
    revalidatePath("/");
    revalidatePath("/products");

    return {
      success: true,
      message: `Product "${product.name}" was permanently deleted.`,
    };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return {
      success: false,
      message: "Database error occurred while deleting the product.",
    };
  }
}

/**
 * Adjusts inventory stock count using an atomic `$inc` operation.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * 1. Atomic `$inc` operator:
 *    - Increments or decrements a numeric value directly on the database engine.
 * 2. Guard Condition against negative inventory:
 *    - When decreasing stock (`change < 0`), we include `{ quantity: { $gte: Math.abs(change) } }`
 *      in the query filter. If available stock is insufficient, the document is NOT matched,
 *      preventing negative inventory under high-concurrency race conditions.
 *
 * @param input - Product ID, amount to change (+/-), and reason description
 * @returns ActionResponse
 */
export async function adjustStock(input: {
  productId: string;
  change: number;
  reason?: string;
}): Promise<ActionResponse<{ newQuantity: number }>> {
  // Step 1: Validate adjustment payload
  const validationResult = StockAdjustmentSchema.safeParse(input);
  if (!validationResult.success) {
    return {
      success: false,
      message: "Invalid adjustment parameters.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { productId, change, reason } = validationResult.data;
  const db = await getDatabase();
  const productObjectId = new ObjectId(productId);
  const now = new Date();

  try {
    // Step 2: Prepare filter criteria
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { _id: productObjectId };

    // If decreasing inventory, prevent reducing below zero
    if (change < 0) {
      filter.quantity = { $gte: Math.abs(change) };
    }

    // Step 3: Execute atomic update using findOneAndUpdate to retrieve the document
    const updateResult = await db.collection("products").findOneAndUpdate(
      filter,
      {
        // $inc adds the number directly (e.g. +5 or -2)
        $inc: { quantity: change },
        // $set updates the timestamp
        $set: { updatedAt: now },
      },
      {
        returnDocument: "after", // Return the document AFTER the update has been applied
      }
    );

    // If no document matched, check whether it was due to missing product or insufficient stock
    if (!updateResult) {
      const existingProduct = await db.collection("products").findOne({ _id: productObjectId });
      if (!existingProduct) {
        return { success: false, message: "Product not found." };
      }
      return {
        success: false,
        message: `Insufficient stock. Current inventory is ${existingProduct.quantity}, cannot reduce by ${Math.abs(change)}.`,
      };
    }

    const newQuantity = Number(updateResult.quantity);
    const previousQuantity = newQuantity - change;

    // Step 4: Write entry to the `stock_movements` audit collection
    await db.collection("stock_movements").insertOne({
      productId: productObjectId,
      change,
      previousQuantity,
      newQuantity,
      reason: reason || (change > 0 ? "Stock Added" : "Stock Removed"),
      createdAt: now,
    });

    // Step 5: Revalidate cached pages
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      message: `Stock updated: ${previousQuantity} → ${newQuantity} (${change > 0 ? "+" : ""}${change})`,
      data: { newQuantity },
    };
  } catch (error) {
    console.error("Failed to adjust stock:", error);
    return {
      success: false,
      message: "Database error occurred while adjusting stock.",
    };
  }
}
