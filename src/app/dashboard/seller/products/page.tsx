"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";

interface Product {
  _id: string;
  title: string;
  price: number;
  stock: number;
  sold: number;
  status: string;
  condition: string;
  images: string[];
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    fetch("/api/products?limit=50")
      .then((r) => r.json())
      .then((d) => { setProducts(d.products ?? []); setLoading(false); });
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleToggleStatus = async (id: string, status: string) => {
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "active" ? "inactive" : "active" }),
    });
    fetchProducts();
  };

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
        <Link href="/dashboard/seller/products/new"
          className="px-5 py-2.5 bg-[#A4860E] hover:bg-[#8a7009] text-white font-semibold rounded-xl transition-colors text-sm">
          + Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Start selling by listing your first product."
          action={
            <Link href="/dashboard/seller/products/new"
              className="px-6 py-2.5 bg-[#A4860E] hover:bg-[#8a7009] text-white font-semibold rounded-xl transition-colors">
              Add Product
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Product", "Price", "Condition", "Stock", "Sold", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">

                  {/* Product cell — image + title */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.title}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                            <i className="fa-solid fa-image text-lg" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-gray-900 max-w-[160px] truncate">{p.title}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-[#A4860E] font-semibold">₦{p.price.toLocaleString()}</td>

                  <td className="px-4 py-3">
                    <span className={`badge ${p.condition === "new" ? "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]" : "bg-yellow-50 text-yellow-700 border border-yellow-200"}`}>
                      {p.condition}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                  <td className="px-4 py-3 text-gray-600">{p.sold}</td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(p._id, p.status)}
                      className={`badge cursor-pointer hover:opacity-80 transition-opacity ${p.status === "active" ? "bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]" : "bg-gray-100 text-gray-500 border border-gray-200"}`}
                    >
                      {p.status}
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/seller/products/${p._id}/edit`}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#A4860E] hover:text-[#A4860E] transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-red-400 hover:border-red-300 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{/* overflow-x-auto */}
        </div>
      )}
    </div>
  );
}
