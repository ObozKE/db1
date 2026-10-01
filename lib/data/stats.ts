/**
 * ==============================================================================
 * Data Access Layer: Dashboard Metrics & Aggregation Pipelines
 * ==============================================================================
 * This file contains analytical queries that compute inventory summary metrics.
 *
 * WHY USE MONGODB AGGREGATION PIPELINES:
 * Instead of pulling thousands of raw product documents over the network into Node.js
 * and calculating sums or averages with JavaScript loops, we send an Aggregation Pipeline
 * directly to MongoDB. The database engine calculates the answers natively in C++ on the
 * server, returning only the small final summary JSON object. This is exponentially faster
 * and consumes minimal memory.
 *
 * STAGES EXPLAINED:
 * - `$facet`: Runs multiple sub-pipelines in parallel over the same input documents.
 * - `$group`: Groups documents by a specific key (like `category`) or combines all (`_id: null`).
 * - `$match`: Filters documents matching criteria (e.g. `quantity <= lowStockThreshold`).
 * - `$sum`: Adds up values or counts documents (`$sum: 1`).
 * - `$multiply`: Multiplies two numeric fields (`price * quantity` = inventory valuation).
 * - `$project`: Reshapes output documents to include only the computed fields.
 */

import "server-only";
import { getDatabase } from "@/lib/mongodb";
import { InventoryStats } from "@/lib/validations";

/**
 * Computes dashboard metrics in a single database round-trip using `$facet`.
 *
 * @returns InventoryStats summary object
 */
export async function getInventoryStats(): Promise<InventoryStats> {
  const db = await getDatabase();
  const collection = db.collection("products");

  /**
   * We execute an Aggregation Pipeline with `$facet`.
   * `$facet` allows us to compute overall totals AND category distributions simultaneously.
   */
  const [result] = await collection
    .aggregate<{
      overall: {
        totalProducts: number;
        totalItemsInStock: number;
        totalStockValue: number;
      }[];
      lowStock: {
        count: number;
      }[];
      outOfStock: {
        count: number;
      }[];
      byCategory: {
        category: string;
        count: number;
        totalQuantity: number;
        totalValue: number;
      }[];
    }>([
      {
        $facet: {
          // Sub-pipeline 1: Compute high-level totals across the entire inventory
          overall: [
            {
              $group: {
                _id: null, // Group all documents into a single summary accumulator
                totalProducts: { $sum: 1 }, // Count total number of product records
                totalItemsInStock: { $sum: "$quantity" }, // Sum of all inventory units
                // Calculate inventory valuation: sum of (price * quantity) for each product
                totalStockValue: {
                  $sum: { $multiply: ["$price", "$quantity"] },
                },
              },
            },
          ],

          // Sub-pipeline 2: Count products where quantity is greater than 0 but <= lowStockThreshold
          lowStock: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", "$lowStockThreshold"] },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],

          // Sub-pipeline 3: Count products with zero units in stock
          outOfStock: [
            {
              $match: {
                quantity: { $lte: 0 },
              },
            },
            {
              $count: "count",
            },
          ],

          // Sub-pipeline 4: Group products by category and calculate counts and valuations per category
          byCategory: [
            {
              $group: {
                _id: "$category", // Group by category name
                count: { $sum: 1 },
                totalQuantity: { $sum: "$quantity" },
                totalValue: {
                  $sum: { $multiply: ["$price", "$quantity"] },
                },
              },
            },
            {
              // Sort categories alphabetically or by value descending
              $sort: { totalValue: -1 },
            },
            {
              // Reshape the output documents for cleaner consumption
              $project: {
                _id: 0,
                category: "$_id",
                count: 1,
                totalQuantity: 1,
                totalValue: 1,
              },
            },
          ],
        },
      },
    ])
    .toArray();

  // Extract the results safely with sensible zero fallbacks
  const overall = result?.overall?.[0] || {
    totalProducts: 0,
    totalItemsInStock: 0,
    totalStockValue: 0,
  };

  const lowStockCount = result?.lowStock?.[0]?.count ?? 0;
  const outOfStockCount = result?.outOfStock?.[0]?.count ?? 0;
  const categoryDistribution = result?.byCategory ?? [];

  return {
    totalProducts: overall.totalProducts,
    totalItemsInStock: overall.totalItemsInStock,
    totalStockValue: Math.round(overall.totalStockValue * 100) / 100,
    lowStockCount,
    outOfStockCount,
    categoryDistribution,
  };
}
