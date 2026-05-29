import ProductForm from "@/components/product/ProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Product" };

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">List New Product</h1>
      <ProductForm mode="create" />
    </div>
  );
}
