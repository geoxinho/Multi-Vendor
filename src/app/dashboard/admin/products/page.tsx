"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Product {
  _id: string;
  title: string;
  price: number;
  status: "active" | "inactive" | "pending_approval" | "rejected";
  rejectionReason?: string;
  condition: string;
  stock: number;
  sold: number;
  images?: string[];
  school?: string;
  seller?: { name: string; storeName?: string; email?: string; school?: string };
  category?: { name: string };
  createdAt: string;
}

const STATUS_CONFIG = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border border-green-200" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-500 border border-gray-200" },
  pending_approval: { label: "Pending Approval", className: "bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold animate-pulse" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border border-red-200" },
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string; code?: string }[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (schoolFilter !== "all") params.set("school", schoolFilter);

    const query = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/admin/products${query}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products ?? []);
        if (d.pendingCount !== undefined) setPendingCount(d.pendingCount);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/schools?all=true")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setSchools(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, schoolFilter]);

  const handleApprove = async (product: Product) => {
    if (!confirm(`Approve "${product.title}"? It will go live immediately.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve product");
      }
    } catch {
      alert("Error approving product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenRejectModal = (product: Product) => {
    setSelectedProduct(product);
    setRejectReason(product.rejectionReason || "");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${selectedProduct._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModalOpen(false);
        setSelectedProduct(null);
        setRejectReason("");
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject product");
      }
    } catch {
      alert("Error rejecting product");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const filtered = products.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.seller?.storeName || p.seller?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.seller?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review, approve, or manage seller product listings</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] bg-white font-medium text-gray-700 shadow-2xs"
          >
            <option value="all">All Campuses</option>
            {schools.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name} {s.code ? `(${s.code})` : ""}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search title, seller, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] w-64 bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: "all", label: "All Products" },
          { id: "pending_approval", label: "Pending Approval", count: pendingCount },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
          { id: "rejected", label: "Rejected" },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-[#A4860E] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white text-[#A4860E]" : "bg-red-500 text-white"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner className="py-32" size="lg" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Product", "Seller", "Campus", "Price", "Stock", "Status", "Review Actions", "Manage"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.inactive;
                  const itemSchool = p.school || p.seller?.school || "General";
                  return (
                    <tr key={p._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Product details */}
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/admin/products/${p._id}`} className="flex items-center gap-3 group">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 group-hover:border-[#A4860E] transition-colors">
                            {p.images && p.images[0] ? (
                              <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="48px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <i className="fa-solid fa-image" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 max-w-[200px] truncate group-hover:text-[#A4860E] transition-colors">{p.title}</p>
                            <span className="text-xs text-gray-400 capitalize">{p.condition} condition &bull; View details &rarr;</span>
                          </div>
                        </Link>
                      </td>

                      {/* Seller */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-800">{p.seller?.storeName || p.seller?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{p.seller?.email}</p>
                      </td>

                      {/* Campus */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a]">
                          <i className="fa-solid fa-graduation-cap text-[10px]" />
                          {itemSchool}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-[#A4860E] font-bold whitespace-nowrap">
                        ₦{p.price.toLocaleString()}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-gray-600">
                        {p.stock} <span className="text-xs text-gray-400">({p.sold} sold)</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                          {p.status === "rejected" && p.rejectionReason && (
                            <p className="text-xs text-red-500 max-w-[180px] leading-snug">
                              <span className="font-semibold">Reason:</span> {p.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Approval Review Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {p.status !== "active" && (
                            <button
                              onClick={() => handleApprove(p)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                            >
                              <i className="fa-solid fa-check" />
                              Approve
                            </button>
                          )}
                          {p.status !== "rejected" && (
                            <button
                              onClick={() => handleOpenRejectModal(p)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <i className="fa-solid fa-xmark" />
                              Reject
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Other Management */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {(p.status === "active" || p.status === "inactive") && (
                            <button
                              onClick={() => handleToggleStatus(p._id, p.status)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                              title="Toggle Active / Inactive"
                            >
                              {p.status === "active" ? "Deactivate" : "Activate"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400">
                      <i className="fa-solid fa-box-open text-4xl mb-3 text-gray-300 block" />
                      No products found under this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <i className="fa-solid fa-triangle-exclamation text-lg" />
                <h3 className="font-bold text-gray-900">Reject Product Listing</h3>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Disapproving <strong>&quot;{selectedProduct.title}&quot;</strong> will mark it as rejected and immediately notify the seller <strong>({selectedProduct.seller?.email})</strong> via email and dashboard.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please upload clearer photos of the item; price is unrealistic; description violates policy..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center gap-2"
                >
                  {actionLoading ? "Rejecting..." : "Confirm Rejection & Email Seller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

