/**
 * ==============================================================================
 * MongoDB Connection Handler & Singleton Client
 * ==============================================================================
 * This module manages the connection lifecycle between Next.js and MongoDB.
 *
 * WHY THIS IS CRUCIAL:
 * In Next.js development mode, files are re-evaluated frequently whenever you save
 * (Hot Module Replacement / Fast Refresh). If we called `new MongoClient().connect()`
 * directly in route files or Server Components, every file edit would instantiate a
 * brand-new database connection pool, quickly exhausting available MongoDB sockets.
 *
 * SOLUTION:
 * We use a global variable (`globalThis`) to cache the connected MongoClient promise
 * across module reloads in development. In production, module caching is stable,
 * so a single shared client promise is preserved across requests.
 *
 * SECURITY:
 * Marked with `import "server-only"` to guarantee that database connection strings
 * and driver logic can NEVER accidentally be bundled or sent to the client browser.
 */

import "server-only";
import { MongoClient, Db } from "mongodb";

// Validate that the MongoDB connection string exists in environment variables
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local (e.g., mongodb://localhost:27017/inventory_db)"
  );
}

// Name of our database in MongoDB
export const DATABASE_NAME = "inventory_db";

// Extend global scope in TypeScript to preserve the connection cache in development
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, check if we already have a cached connection promise in globalThis.
  // If not, create a new MongoClient and store its connection promise globally.
  if (!globalThis._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10, // Maintain a pool of up to 10 reusable connections
      serverSelectionTimeoutMS: 5000, // Timeout fast if MongoDB server is unreachable
    });
    globalThis._mongoClientPromise = client.connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  // In production mode, global caching is not needed because the Node process is long-lived
  // and does not reload modules on the fly.
  client = new MongoClient(uri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 5000,
  });
  clientPromise = client.connect();
}

/**
 * Returns the connected MongoClient instance.
 *
 * @returns Promise resolving to the active MongoClient
 */
export async function getClient(): Promise<MongoClient> {
  return await clientPromise;
}

/**
 * Convenience helper to return the target database (`inventory_db`).
 *
 * All queries and operations in this application work with this database instance.
 *
 * @returns Promise resolving to the MongoDB `Db` instance
 */
export async function getDatabase(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(DATABASE_NAME);
}

export default clientPromise;
