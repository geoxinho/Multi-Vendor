"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProductDetail {
  _id: string;
  title: string;
  description: string;
  price: number;
  condition: "new" | "used";
  images: string[];
  category?: { _id: string; name: string; slug: string };
  seller?: {
    _id: string;
    name: string;
    storeName?: string;
    email: string;
    phone?: string;
    school?: string;
    nin?: string;
    avatar?: string;
    storeDescription?: string;
    bankDetails?: {
      bankName?: string;
      bankCode?: string;
      accountNumber?: string;
      accountName?: string;
    };
  };
  stock: number;
  sold: number;
  rating: number;
  numReviews: number;
  status: "active" | "inactive" | "pending_approval" | "rejected";
  rejectionReason?: string;
  isFeatured?: boolean;
  tags?: string[];
  variants?: {
    sizes?: string[];
    colors?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  active: { label: "Active", className: "bg-green-100 text-green-700 border border-green-200" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-500 border border-gray-200" },
  pending_approval: { label: "Pending Approval", className: "bg-yellow-100 text-yellow-800 border border-yellow-300 font-semibold" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border border-red-200" },
};

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchProduct = () => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        if (data.rejectionReason) setRejectReason(data.rejectionReason);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleApprove = async () => {
    if (!product || !confirm(`Approve "${product.title}"? It will go live immediately.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (res.ok) {
        fetchProduct();
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

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason }),
      });
      if (res.ok) {
        setRejectModalOpen(false);
        fetchProduct();
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

  const handleToggleStatus = async () => {
    if (!product) return;
    const nextStatus = product.status === "active" ? "inactive" : "active";
    await fetch(`/api/products/${product._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchProduct();
  };

  const handleDelete = async () => {
    if (!product || !confirm("Delete this product permanently?")) return;
    await fetch(`/api/products/${product._id}`, { method: "DELETE" });
    router.push("/dashboard/admin/products");
  };

  if (loading) return <LoadingSpinner className="py-32" size="lg" />;

  if (!product) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The requested product could not be located.</p>
        <Link
          href="/dashboard/admin/products"
          className="px-5 py-2.5 bg-[#A4860E] text-white font-semibold rounded-xl text-sm hover:bg-[#8a7009]"
        >
          &larr; Back to Products
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.inactive;
  const platformFee = product.price * 0.05;
  const netSellerPayout = product.price - platformFee;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top navigation & action header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/products"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-sm" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{product.title}</h1>
              <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">ID: {product._id} &bull; Listed {new Date(product.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {product.status === "active" && (
            <Link
              href={`/products/${product._id}`}
              target="_blank"
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-arrow-up-right-from-square" />
              View on Store
            </Link>
          )}

          {product.status !== "active" && (
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-check" />
              Approve Listing
            </button>
          )}

          {product.status !== "rejected" && (
            <button
              onClick={() => setRejectModalOpen(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <i className="fa-solid fa-xmark" />
              Reject
            </button>
          )}

          {(product.status === "active" || product.status === "inactive") && (
            <button
              onClick={handleToggleStatus}
              className="px-3.5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors"
            >
              {product.status === "active" ? "Deactivate" : "Activate"}
            </button>
          )}

          <button
            onClick={handleDelete}
            className="px-3.5 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
          >
            <i className="fa-solid fa-trash mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Review Alert Banner if pending or rejected */}
      {product.status === "pending_approval" && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-clock-rotate-left text-yellow-600 text-lg mt-0.5" />
            <div>
              <p className="text-sm font-bold text-yellow-900">This product is awaiting admin review</p>
              <p className="text-xs text-yellow-700 mt-0.5">It is currently hidden from buyers. Review the seller details, description, and images below to approve or reject.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleApprove}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Approve Now
            </button>
            <button
              onClick={() => setRejectModalOpen(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {product.status === "rejected" && product.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-lg mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-900">Listing was rejected</p>
            <p className="text-xs text-red-800 mt-1"><span className="font-semibold">Reason provided:</span> {product.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Images & Description (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Photos ({product.images?.length ?? 0})</h2>
            
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {product.images && product.images[activeImage] ? (
                <Image
                  src={product.images[activeImage]}
                  alt={product.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <i className="fa-solid fa-image text-3xl" />
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImage === idx ? "border-[#A4860E] ring-2 ring-[#A4860E]/20" : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</h2>
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              {product.description || "No description provided."}
            </div>
          </div>

          {/* Variants & Tags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Variants &amp; Tags</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1.5">Available Sizes:</p>
                {product.variants?.sizes && product.variants.sizes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.sizes.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-amber-50 text-[#A4860E] border border-amber-200 rounded-lg text-xs font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">None specified</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1.5">Available Colours:</p>
                {product.variants?.colors && product.variants.colors.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {product.variants.colors.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">None specified</p>
                )}
              </div>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-500 font-semibold mb-1.5">Search Tags:</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs border border-gray-200">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing, Inventory & Seller (1 col) */}
        <div className="space-y-6">
          {/* Price & Financials */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pricing &amp; Commission</h2>
            
            <div className="bg-[#fdf8e8] border border-[#e8d48a] rounded-xl p-4">
              <p className="text-xs text-[#A4860E] font-semibold">Listing Price</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">₦{product.price.toLocaleString()}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Platform Commission (5%):</span>
                <span className="font-semibold text-gray-800">₦{platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Net Seller Payout (95%):</span>
                <span className="font-semibold text-emerald-700">₦{netSellerPayout.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Product Specifications & Inventory */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3.5 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Specifications &amp; Stock</h2>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Category:</span>
                <span className="font-semibold text-gray-900">{product.category?.name || "Uncategorized"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Condition:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${product.condition === "new" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {product.condition}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Available Stock:</span>
                <span className="font-bold text-gray-900">{product.stock} units</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Total Sold:</span>
                <span className="font-semibold text-gray-900">{product.sold} units</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Rating / Reviews:</span>
                <span className="font-semibold text-amber-600">
                  ★ {product.rating.toFixed(1)} ({product.numReviews} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Seller Information Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3.5 shadow-xs">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Seller Profile</h2>

            {product.seller ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#A4860E] to-[#c9a820] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs">
                    {product.seller.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{product.seller.storeName || product.seller.name}</p>
                    <p className="text-xs text-gray-500 truncate">{product.seller.name}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-gray-400 block">Email:</span>
                    <a href={`mailto:${product.seller.email}`} className="text-[#A4860E] hover:underline font-medium break-all">
                      {product.seller.email}
                    </a>
                  </div>
                  {product.seller.phone && (
                    <div>
                      <span className="text-gray-400 block">Phone:</span>
                      <span className="text-gray-800 font-medium">{product.seller.phone}</span>
                    </div>
                  )}
                  {product.seller.school && (
                    <div>
                      <span className="text-gray-400 block">Campus / School:</span>
                      <span className="text-gray-800 font-medium">{product.seller.school}</span>
                    </div>
                  )}
                  {product.seller.nin && (
                    <div>
                      <span className="text-gray-400 block">NIN:</span>
                      <span className="font-mono text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded">{product.seller.nin}</span>
                    </div>
                  )}

                  {product.seller.bankDetails?.accountNumber && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 bg-gray-50 p-2.5 rounded-xl">
                      <span className="text-gray-500 font-bold block mb-1">Bank Settlement Info:</span>
                      <p className="text-gray-800 font-semibold">{product.seller.bankDetails.bankName}</p>
                      <p className="text-gray-700">{product.seller.bankDetails.accountName}</p>
                      <p className="font-mono text-gray-600">{product.seller.bankDetails.accountNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Seller information not available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
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
              Disapproving <strong>&quot;{product.title}&quot;</strong> will notify <strong>{product.seller?.email}</strong> via email and display the reason in their seller dashboard.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Inappropriate images, price seems inaccurate, missing item specifics..."
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