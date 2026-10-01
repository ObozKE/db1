/**
 * ==============================================================================
 * Edit Product Page
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * WHY A SERVER COMPONENT:
 * Reads `params` asynchronously (using `await params` per Next.js 15+ conventions)
 * and retrieves the document directly from MongoDB via `getProductById(id)` before
 * feeding it into the interactive `ProductForm`.
 *
 * MONGODB CONCEPTS DEMONSTRATED:
 * Point lookup via `findOne({ _id: new ObjectId(id) })`.
 */

import { notFound } from "next/navigation";
import { getProductById } from "@/lib/data/products";
import { ProductForm } from "@/components/product-form";

export const metadata = {
  title: "Edit Product | Inventory Management System",
};

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  // In Next.js 15+, route parameters must be awaited
  const { id } = await params;

  // Retrieve product from MongoDB
  const product = await getProductById(id);

  // If document does not exist, trigger 404 page
  if (!product) {
    notFound();
  }

  return (
    <div className="py-6">
      <ProductForm initialData={product} isEditing={true} />
    </div>
  );
}
