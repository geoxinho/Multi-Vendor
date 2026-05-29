import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";
import ProductForm from "@/components/product/ProductForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Product" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  await connectDB();

  const product = await Product.findById(id).lean();
  if (!product) notFound();

  // Only owner or admin can edit
  if (product.seller.toString() !== session!.user.id && session!.user.role !== "admin") {
    notFound();
  }

  const data = JSON.parse(JSON.stringify(product));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Product</h1>
      <ProductForm
        mode="edit"
        initialData={{
          _id: data._id,
          title: data.title,
          description: data.description,
          price: data.price,
          condition: data.condition,
          category: data.category,
          stock: data.stock,
          images: data.images,
          status: data.status,
        }}
      />
    </div>
  );
}
