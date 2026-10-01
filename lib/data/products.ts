/**
 * ==============================================================================
 * Data Access Layer: Product Queries
 * ==============================================================================
 * This file contains all READ operations for products.
 *
 * ARCHITECTURAL PRINCIPLE:
 * In Next.js App Router, React Server Components fetch data by directly calling
 * these async functions on the server. There is no need for intermediary internal
 * API routes (e.g. /api/products) because Server Components execute securely inside
 * Node.js on the server side.
 *
 * OBJECTID SERIALIZATION RULE:
 * MongoDB returns `_id` as a BSON `ObjectId` instance. React Server Components
 * cannot pass complex BSON objects to Client Components because only JSON-serializable
 * primitives (strings, numbers, plain objects, arrays) can cross the boundary.
 * Therefore, we map `_id.toString()` to an `id` string property on every document.
 */

import "server-only";
import { ObjectId, Filter, Sort } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { Product, StockMovement } from "@/lib/validations";

/**
 * Filter and pagination options passed from Next.js URL searchParams
 */
export interface GetProductsOptions {
  query?: string;
  category?: string;
  sortBy?: "name" | "sku" | "category" | "quantity" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Helper function to transform raw MongoDB BSON document into a clean,
 * serializable TypeScript `Product` object.
 *
 * @param doc - Raw MongoDB document
 * @returns Clean Product object with stringified IDs and dates
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatProductDocument(doc: any): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    sku: doc.sku,
    category: doc.category,
    // supplier: doc.supplier ? String(doc.supplier) : undefined, // [LEARNING DEMO: NEW FIELD] Uncomment to return supplier from database
    quantity: Number(doc.quantity),
    price: Number(doc.price),
    lowStockThreshold: Number(doc.lowStockThreshold ?? 5),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : new Date(doc.updatedAt).toISOString(),
  };
}

/**
 * Fetches a list of products matching search query and category filters,
 * with sorting and pagination applied.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * 1. Filter constructing with `$regex` (for case-insensitive partial substring match)
 * 2. `$or` operator to search across multiple fields (e.g. name OR sku)
 * 3. `collection.find(filter).sort().skip().limit().toArray()` pipeline
 * 4. `collection.countDocuments(filter)` for accurate pagination totals
 *
 * @param options - Search term, category filter, sorting, and pagination
 * @returns Paginated products list and metadata
 */
export async function getProducts(
  options: GetProductsOptions = {}
): Promise<PaginatedProductsResult> {
  const {
    query = "",
    category = "",
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = options;

  const db = await getDatabase();
  const collection = db.collection("products");

  // Build the MongoDB filter criteria dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Filter<any> = {};

  // If a search query is provided, search across both 'name' and 'sku' using $regex.
  // '$options: "i"' makes the regex case-insensitive.
  if (query.trim()) {
    const searchRegex = new RegExp(query.trim(), "i");
    filter.$or = [
      { name: { $regex: searchRegex } },
      { sku: { $regex: searchRegex } },
    ];
  }

  // If a specific category is selected, filter by exact category name
  if (category.trim() && category !== "ALL") {
    filter.category = category.trim();
  }

  // Determine sort direction: 1 for Ascending (A-Z, 0-9), -1 for Descending (Z-A, 9-0)
  const sortDirection = sortOrder === "asc" ? 1 : -1;
  const sortOption: Sort = { [sortBy]: sortDirection };

  // Calculate pagination offset: skip (page - 1) * limit
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * limit;

  // Run the MongoDB query and the total count in parallel using Promise.all for maximum performance
  const [rawProducts, totalCount] = await Promise.all([
    collection
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  const products = rawProducts.map(formatProductDocument);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    products,
    total: totalCount,
    page: safePage,
    totalPages,
  };
}

/**
 * Fetches a single product by its 24-character hexadecimal MongoDB ObjectId.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * - `findOne({ _id: new ObjectId(id) })` performs an indexed point-lookup using
 *   the default primary key index on `_id`, which executes in O(1) time.
 *
 * @param id - The 24-character hex string representing the MongoDB ObjectId
 * @returns The Product object if found, or null
 */
export async function getProductById(id: string): Promise<Product | null> {
  // Guard against invalid ObjectId strings that would cause BSON errors
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const db = await getDatabase();
  const doc = await db.collection("products").findOne({ _id: new ObjectId(id) });

  if (!doc) {
    return null;
  }

  return formatProductDocument(doc);
}

/**
 * Fetches a list of all distinct category names currently in use.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * - `collection.distinct("category")` scans the index to retrieve unique values
 *   without loading the full document bodies into memory.
 *
 * @returns Array of unique category names
 */
export async function getCategories(): Promise<string[]> {
  const db = await getDatabase();
  const categories = await db.collection("products").distinct("category");
  return (categories as string[]).filter(Boolean).sort();
}

/**
 * Retrieves the most recent stock movement audit logs.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * - `$lookup` aggregation stage joins `stock_movements` with `products`
 *   to retrieve current product names alongside audit records.
 *
 * @param limit - Maximum number of logs to return
 * @returns Array of recent stock movements
 */
export async function getRecentStockMovements(limit = 8): Promise<StockMovement[]> {
  const db = await getDatabase();
  
  const logs = await db
    .collection("stock_movements")
    .aggregate([
      // Stage 1: Sort by timestamp descending so the newest changes appear first
      { $sort: { createdAt: -1 } },
      // Stage 2: Limit to the requested batch size
      { $limit: limit },
      // Stage 3: Perform a Left Outer Join with the `products` collection on `productId`
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      // Stage 4: Unwind the productDetails array so it becomes an embedded object
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ])
    .toArray();

  return logs.map((log) => ({
    id: log._id.toString(),
    productId: log.productId.toString(),
    productName: log.productDetails?.name ?? "Deleted Product",
    productSku: log.productDetails?.sku ?? "N/A",
    change: log.change,
    previousQuantity: log.previousQuantity,
    newQuantity: log.newQuantity,
    reason: log.reason,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : new Date(log.createdAt).toISOString(),
  }));
}
