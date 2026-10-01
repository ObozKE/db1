/**
 * ==============================================================================
 * Create Product Page
 * ==============================================================================
 * TYPE: React Server Component (RSC)
 *
 * PURPOSE:
 * Serves as the page envelope hosting the client-side `ProductForm` in creation mode.
 */

import { ProductForm } from "@/components/product-form";

export const metadata = {
  title: "New Product | Inventory Management System",
};

export default function NewProductPage() {
  return (
    <div className="py-6">
      <ProductForm isEditing={false} />
    </div>
  );
}
