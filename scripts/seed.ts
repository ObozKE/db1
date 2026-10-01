/**
 * ==============================================================================
 * Database Seed Script & Index Management
 * ==============================================================================
 * This standalone script initializes the MongoDB database (`inventory_db`),
 * creates critical indexes, and seeds 15 realistic inventory items with diverse
 * stock levels (In Stock, Low Stock, Out of Stock) and audit history.
 *
 * HOW TO RUN:
 *   npm run seed
 *   (or: npx tsx scripts/seed.ts)
 *
 * WHY INDEXES MATTER IN MONGODB:
 * 1. Default `_id` Index: Automatically created B-Tree index on `_id`.
 * 2. Unique Index on `sku`: Guarantees uniqueness at the database level so two
 *    products can never share the same SKU code, even during simultaneous inserts.
 * 3. Text/Compound Indexes: Speeds up text queries by indexing individual words,
 *    preventing slow "Collection Scans" (COLLSCAN) across millions of documents.
 * 4. Audit Log Index: `{ productId: 1, createdAt: -1 }` accelerates timeline queries.
 */

import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      const val = values.join("=").trim().replace(/(^['"]|['"]$)/g, "");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/inventory_db";
const dbName = "inventory_db";

interface SeedProduct {
  name: string;
  sku: string;
  category: string;
  // supplier?: string; // [LEARNING DEMO: NEW FIELD] Uncomment to include supplier in seed data
  quantity: number;
  price: number;
  lowStockThreshold: number;
}

const SAMPLE_PRODUCTS: SeedProduct[] = [
  {
    name: 'UltraSharp 27" 4K USB-C Hub Monitor',
    sku: "ELEC-MON-001",
    category: "Electronics",
    quantity: 18,
    price: 72000,
    lowStockThreshold: 5,
  },
  {
    name: "Wireless Mechanical Keyboard (Brown Switches)",
    sku: "ELEC-KEY-002",
    category: "Electronics",
    quantity: 42,
    price: 16500,
    lowStockThreshold: 10,
  },
  {
    name: "Ergonomic Vertical Mouse (Rechargeable)",
    sku: "ELEC-MOU-003",
    category: "Electronics",
    quantity: 3, // LOW STOCK
    price: 8900,
    lowStockThreshold: 5,
  },
  {
    name: "Thunderbolt 4 Docking Station 12-in-1",
    sku: "ELEC-DOC-004",
    category: "Electronics",
    quantity: 0, // OUT OF STOCK
    price: 32500,
    lowStockThreshold: 4,
  },
  {
    name: "code changes Support",
    sku: "FURN-CHR-001",
    category: "Furniture",
    quantity: 12,
    price: 49000,
    lowStockThreshold: 4,
  },
  {
    name: "Electric Dual-Motor Standing Desk (60x30 inch)",
    sku: "FURN-DSK-002",
    category: "Furniture",
    quantity: 7,
    price: 65000,
    lowStockThreshold: 3,
  },
  {
    name: "Under-Desk Cable Management Spine",
    sku: "FURN-ACC-003",
    category: "Furniture",
    quantity: 2, // LOW STOCK
    price: 4500,
    lowStockThreshold: 5,
  },
  {
    name: "Active Noise Cancelling Wireless Headphones",
    sku: "AUDI-HDP-001",
    category: "Audio",
    quantity: 25,
    price: 38500,
    lowStockThreshold: 8,
  },
  {
    name: "USB-C Cardioid Condenser Podcast Microphone",
    sku: "AUDI-MIC-002",
    category: "Audio",
    quantity: 14,
    price: 19500,
    lowStockThreshold: 5,
  },
  {
    name: "Desktop Studio Monitor Speakers (Pair)",
    sku: "AUDI-SPK-003",
    category: "Audio",
    quantity: 0, // OUT OF STOCK
    price: 26000,
    lowStockThreshold: 3,
  },
  {
    name: "Cat6 Ethernet Patch Cable 10ft (10-Pack)",
    sku: "NETW-CAB-001",
    category: "Networking",
    quantity: 85,
    price: 3200,
    lowStockThreshold: 15,
  },
  {
    name: "Wi-Fi 6E Tri-Band Mesh Router System",
    sku: "NETW-RTR-002",
    category: "Networking",
    quantity: 9,
    price: 42000,
    lowStockThreshold: 4,
  },
  {
    name: "Anodized Aluminum Laptop Riser Stand",
    sku: "ACCS-STD-001",
    category: "Accessories",
    quantity: 60,
    price: 5800,
    lowStockThreshold: 10,
  },
  {
    name: "Large Extended Felt & Leather Desk Pad",
    sku: "ACCS-MAT-002",
    category: "Accessories",
    quantity: 4, // LOW STOCK
    price: 3600,
    lowStockThreshold: 8,
  },
  {
    name: "High-Capacity 25,000mAh Power Bank (100W USB-C)",
    sku: "ACCS-BAT-003",
    category: "Accessories",
    quantity: 31,
    price: 11500,
    lowStockThreshold: 6,
  },
];

async function seed() {
  console.log("--------------------------------------------------");
  console.log("📦 Starting MongoDB Inventory Database Seeding...");
  console.log(`🔗 Connecting to: ${uri}`);
  console.log("--------------------------------------------------");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB server.");

    const db = client.db(dbName);
    const productsCollection = db.collection("products");
    const movementsCollection = db.collection("stock_movements");

    // 1. Drop existing data to ensure a clean, reproducible state
    console.log("\n🧹 Cleaning existing collections...");
    await productsCollection.deleteMany({});
    await movementsCollection.deleteMany({});

    // 2. Set up database indexes
    console.log("\n⚡ Creating Indexes...");

    // Unique Index on SKU: Enforces business logic at database storage level
    await productsCollection.createIndex({ sku: 1 }, { unique: true });
    console.log("  ✓ Created UNIQUE index on products.sku");

    // Text Index on name and category: Enables fast full-text searching
    await productsCollection.createIndex(
      { name: "text", category: "text" },
      { name: "ProductTextIndex" }
    );
    console.log("  ✓ Created TEXT index on products (name, category)");

    // Compound Index on stock_movements for audit timeline lookups
    await movementsCollection.createIndex({ productId: 1, createdAt: -1 });
    console.log("  ✓ Created COMPOUND index on stock_movements (productId, createdAt)");

    // 3. Insert sample products and corresponding stock movement audit records
    console.log("\n🌱 Inserting sample products...");
    const now = new Date();

    for (const item of SAMPLE_PRODUCTS) {
      const productResult = await productsCollection.insertOne({
        name: item.name,
        sku: item.sku,
        category: item.category,
        // supplier: (item as any).supplier || undefined, // [LEARNING DEMO: NEW FIELD] Uncomment to insert supplier
        quantity: item.quantity,
        price: item.price,
        lowStockThreshold: item.lowStockThreshold,
        createdAt: now,
        updatedAt: now,
      });

      // If initial quantity is greater than zero, log it to the audit collection
      if (item.quantity > 0) {
        await movementsCollection.insertOne({
          productId: productResult.insertedId,
          change: item.quantity,
          previousQuantity: 0,
          newQuantity: item.quantity,
          reason: "Initial Inventory Seed",
          createdAt: now,
        });
      }
    }

    console.log(`✅ Seeded ${SAMPLE_PRODUCTS.length} sample products with initial audit logs.`);
    console.log("\n🎉 Database setup & seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔒 Closed MongoDB client connection.\n");
  }
}

seed();


/* In this codebase, database responsibilities are separated into specific files depending on what kind of change you want to make:

1. If you want to change the Database Name or Connection Settings
Files: lib/mongodb.ts and .env.local
What to change:
In .env.local: Change MONGODB_URI (your cluster URL / credentials).
In lib/mongodb.ts: Change DATABASE_NAME = "inventory_db" or connection pool settings (maxPoolSize).
2. If you want to add or modify Product Fields (e.g. adding supplier or barcode)
File: lib/validations.ts
What to change:
Update ProductSchema with the new field and validation rules.
Update the TypeScript Product and ProductInput interfaces.
3. If you want to change how Data is Read or Queried (GET / Search / Analytics)
Files:
lib/data/products.ts: For product lookups, search filters ($regex, $or), sorting, pagination, and $lookup audit history.
lib/data/stats.ts: For dashboard metrics and MongoDB Aggregation Pipelines ($group, $facet, $sum, $match).
4. If you want to change how Data is Created, Updated, or Deleted (Mutations)
File: app/actions.ts
What to change:
createProduct(): Modifies db.collection("products").insertOne(...).
updateProduct(): Modifies db.collection("products").updateOne(...) with $set.
deleteProduct(): Modifies db.collection("products").deleteOne(...).
adjustStock(): Modifies the atomic $inc update or audit log entry.
5. If you want to change Indexes or Initial Sample Data
File: scripts/seed.ts
What to change:
Add or change database indexes (createIndex).
Modify the SAMPLE_PRODUCTS array and run npm run seed.
6. If you want the Form to accept the new Database Fields in the UI
Files:
components/product-form.tsx: Add input fields to the form.
components/product-table.tsx: Add a new column to the table to display it.
💡 Quick Rule of Thumb:
Data validation & types? 
→
→ lib/validations.ts
Reading from MongoDB? 
→
→ lib/data/
Writing to MongoDB? 
→
→ app/actions.ts
Database connection? 
→
→ lib/mongodb.ts
9:36 PM */
