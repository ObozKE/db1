# 🧠 MongoDB & Database Concepts: Educational Learning Notes

Welcome to the learning guide for **MongoDB and Modern Full-Stack Database Architecture**. This document covers the foundational concepts implemented across this application.

---

## 1. Relational Databases (SQL) vs. Document Databases (NoSQL)

| Feature | Relational (PostgreSQL, MySQL) | Document-Oriented (MongoDB) |
| :--- | :--- | :--- |
| **Data Format** | Tables, Rows, Columns | Collections, Documents (BSON / JSON-like) |
| **Primary Identifier** | Integer Auto-increment or UUID | 12-byte BSON `ObjectId` (`_id`) |
| **Schema** | Rigid, strict schema defined via DDL (`CREATE TABLE`) | Flexible, polymorphic schema with application-level validation |
| **Relationships** | Foreign Keys and `JOIN` statements | Embedded Subdocuments or Document References (`$lookup`) |
| **Query Language** | SQL (`SELECT * FROM table WHERE ...`) | JSON-based MQL (`collection.find({ ... })`) |
| **Scaling Strategy** | Vertical (larger CPU/RAM) or read replicas | Native Horizontal Sharding and Replica Sets |

### Why BSON (Binary JSON)?
MongoDB stores data as **BSON** (Binary JSON). BSON extends JSON by adding support for specialized data types:
- `ObjectId`: 12-byte binary identifier containing a 4-byte timestamp, 5-byte random value, and 3-byte incrementing counter.
- `Date`: 64-bit integer representing milliseconds since the Unix epoch.
- `Decimal128` & `Double`: Exact floating-point math for financial calculations.

---

## 2. Connection Pooling & The Singleton Pattern in Next.js

### The Problem in Development Environments
In Node.js applications with Hot Module Replacement (HMR) like Next.js, whenever you edit a file, the Node module cache is refreshed. If database connections are created at top-level module scope without caching:
```typescript
// ❌ ANTI-PATTERN:
const client = new MongoClient(process.env.MONGODB_URI);
export const db = client.db("inventory_db");
```
Every file edit spawns a brand new `MongoClient` connection pool (often 10–50 socket connections per pool). Within a few minutes of active coding, MongoDB exhausts its maximum connection limit (`Too many open connections`).

### The Solution: Global Singleton Cache (`lib/mongodb.ts`)
```typescript
// ✅ BEST PRACTICE:
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10 });
    globalThis._mongoClientPromise = client.connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  const client = new MongoClient(uri, { maxPoolSize: 20 });
  clientPromise = client.connect();
}
```
In development, `globalThis` survives module reloads, ensuring only **one persistent connection pool** exists throughout your entire development session.

---

## 3. Database Indexes: IXSCAN vs. COLLSCAN

### What is an Index?
By default, when you query a collection without an index, MongoDB must inspect every single document in the collection from beginning to end. This is known as a **Collection Scan (`COLLSCAN`)** and has $O(N)$ time complexity.

An **Index** creates a specialized B-Tree data structure storing sorted field values pointing directly to document disk locations. When querying on an indexed field, MongoDB performs an **Index Scan (`IXSCAN`)** with $O(\log N)$ time complexity.

```
Without Index (COLLSCAN):
Query: { sku: "ELEC-KEY-002" }
Scans: Document 1 ➔ Document 2 ➔ ... ➔ Document 1,000,000 (Slow!)

With Index (IXSCAN):
Query: { sku: "ELEC-KEY-002" }
B-Tree Traversal: Root ➔ Intermediate Node ➔ Leaf Node ➔ Direct Document Fetch (Instant!)
```

### Types of Indexes Used in This Project:
1. **Default `_id` Index**: Automatically created on every collection for primary key lookups.
2. **Unique Index on `sku`**:
   ```typescript
   await productsCollection.createIndex({ sku: 1 }, { unique: true });
   ```
   Enforces that no two products can have the same SKU. If an `insertOne` or `updateOne` attempts to insert a duplicate SKU, MongoDB rejects the write immediately with **Error Code 11000 (`DuplicateKeyError`)**.
3. **Text Search Index**:
   ```typescript
   await productsCollection.createIndex({ name: "text", category: "text" });
   ```
   Enables full-text tokenized keyword matching across product names and categories.
4. **Compound Index on Audit Logs**:
   ```typescript
   await movementsCollection.createIndex({ productId: 1, createdAt: -1 });
   ```
   Optimizes filtering audit records by a specific product and sorting by newest first.

---

## 4. Atomic Updates & Preventing Concurrency Race Conditions

### The Classic Race Condition (Read-Modify-Write)
Imagine two customers simultaneously purchase the last remaining item (`quantity = 1`):

```
Time  | Request A (User 1)             | Request B (User 2)
------|--------------------------------|--------------------------------
T1    | Reads quantity (gets 1)        |
T2    |                                | Reads quantity (gets 1)
T3    | Computes: 1 - 1 = 0            | Computes: 1 - 1 = 0
T4    | Writes quantity = 0            |
T5    |                                | Writes quantity = 0
Result: 2 items sold, but only 1 was in stock! Oversold inventory!
```

### The Solution: Atomic `$inc` with Query Guards (`app/actions.ts`)
MongoDB guarantees that individual document modifications are **atomic**. By using the `$inc` operator and placing the stock guard inside the query filter itself, the database server handles concurrency safely without application locks:

```typescript
const result = await db.collection("products").findOneAndUpdate(
  {
    _id: new ObjectId(productId),
    quantity: { $gte: Math.abs(change) }, // 🛡️ GUARD: Only match if stock is sufficient
  },
  {
    $inc: { quantity: change }, // ⚡ ATOMIC: Decrements on the database server directly
    $set: { updatedAt: new Date() },
  },
  { returnDocument: "after" }
);
```

If User 1's decrement succeeds, the stock becomes `0`. When User 2's query runs, the filter `{ quantity: { $gte: 1 } }` matches **zero documents**, and `result` returns `null`. The application catches this and returns: `"Insufficient stock. Cannot reduce below zero."`

---

## 5. MongoDB Aggregation Pipelines

### What is an Aggregation Pipeline?
An aggregation pipeline processes documents through a series of stages, like an assembly line:
$$\text{Raw Documents} \longrightarrow \text{Stage 1: \$match} \longrightarrow \text{Stage 2: \$group} \longrightarrow \text{Stage 3: \$project} \longrightarrow \text{Final Output}$$

### Key Stages Explained:
1. **`$facet`**: Executes multiple independent aggregation pipelines in parallel across the same input dataset within a single database round-trip.
2. **`$group`**: Groups documents by a specific key (`_id: "$category"` or `_id: null` for total dataset) and computes accumulators (`$sum`, `$avg`, `$min`, `$max`).
3. **`$match`**: Filters documents according to specified criteria before passing them to the next stage.
4. **`$multiply`**: Multiplies two numeric expressions (e.g. `["$price", "$quantity"]` to calculate inventory valuation).
5. **`$lookup`**: Performs a Left Outer Join between collections (e.g. joining `stock_movements.productId` with `products._id`).
6. **`$project`**: Reshapes the output document structure, renaming fields and excluding unnecessary properties.

### Example Pipeline from `lib/data/stats.ts`:
```typescript
collection.aggregate([
  {
    $facet: {
      overall: [
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
      ],
      byCategory: [
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
      ],
    },
  },
]);
```

---

## 6. React Server Components & ObjectId Serialization

### Why `ObjectId` Must Be Converted to String
In Next.js App Router:
- **Server Components** run in Node.js on the server and have access to native BSON instances (`ObjectId`).
- **Client Components** run in the browser and receive data serialized as JSON across the Network boundary.

Because a BSON `ObjectId` is a custom class with methods and internal byte buffers, Next.js will throw a serialization warning if an `ObjectId` is passed directly as a prop to a Client Component:
`Error: Only plain objects can be passed to Client Components from Server Components. Objects with toJSON methods are not supported.`

### The Pattern:
We transform all MongoDB query outputs in `lib/data/products.ts`:
```typescript
function formatProductDocument(doc: any): Product {
  return {
    id: doc._id.toString(), // Convert ObjectId to plain 24-character hex string
    name: doc.name,
    sku: doc.sku,
    category: doc.category,
    quantity: Number(doc.quantity),
    price: Number(doc.price),
    lowStockThreshold: Number(doc.lowStockThreshold ?? 5),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
```
This ensures complete type safety, predictable JSON serialization, and full compatibility across the Server/Client boundary.
