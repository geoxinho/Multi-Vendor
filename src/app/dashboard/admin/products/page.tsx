"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Product {
  _id: string;
  title: string;
  price: number;
  status: string;
  condition: string;
  stock: number;
  sold: number;
  seller: { name: string; storeName?: string };
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    fetch("/api/products?limit=50&sort=-createdAt")
      .then((r) => r.json())
      .then((d) => { setProducts(d.products ?? []); setLoading(false); });
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleToggleStatus = async (id: string, status: string) => {
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "active" ? "inactive" : "active" }),
    });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">All Products</h1>

      {loading ? <LoadingSpinner className="py-32" size="lg" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Product", "Seller", "Price", "Condition", "Stock", "Sold", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.seller?.storeName || p.seller?.name}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">₦{p.price.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.condition === "new" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {p.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.stock}</td>
                  <td className="px-4 py-3 text-gray-600">{p.sold}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(p._id, p.status)}
                      className={`badge cursor-pointer hover:opacity-80 transition-opacity ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-10 text-center text-gray-400">No products found.</div>
          )}
        </div>
      )}
    </div>
  );
}
