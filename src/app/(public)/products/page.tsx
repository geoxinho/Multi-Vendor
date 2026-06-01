"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/shared/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import SearchBar from "@/components/shared/SearchBar";
import { ProductSummary } from "@/types";

interface Category { _id: string; name: string; slug: string }

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const sort = searchParams.get("sort") ?? "-createdAt";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "12", sort });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (condition) params.set("condition", condition);

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search, category, condition, sort]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetch("/api/categories").then((r) => r.json()).then(setCategories); }, []);

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    p.delete("page");
    router.push(`/products?${p}`);
  };

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className={`w-full lg:w-56 shrink-0 ${isFilterOpen ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-6 sticky top-20">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button className="lg:hidden p-1 text-gray-500" onClick={() => setIsFilterOpen(false)}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Condition</p>
              {["", "new", "used"].map((c) => (
                <button key={c}
                  onClick={() => updateParam("condition", c)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${condition === c ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                  {c === "" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
                <button
                  onClick={() => updateParam("category", "")}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${!category ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button key={cat._id}
                    onClick={() => updateParam("category", cat._id)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors truncate ${category === cat._id ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Sort */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sort By</p>
              {[
                { value: "-createdAt", label: "Newest" },
                { value: "price", label: "Price: Low to High" },
                { value: "-price", label: "Price: High to Low" },
                { value: "-rating", label: "Top Rated" },
              ].map((s) => (
                <button key={s.value}
                  onClick={() => updateParam("sort", s.value)}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${sort === s.value ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="mb-6 md:hidden">
            <SearchBar defaultValue={search} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? "Loading..." : `${total} product${total !== 1 ? "s" : ""} found`}
            </p>
            {(search || category || condition) && (
              <button
                onClick={() => router.push("/products")}
                className="text-sm text-red-500 hover:underline">
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <LoadingSpinner className="py-32" size="lg" />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms."
              icon={<svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
          ) : (
            <>
              <ProductGrid products={products} />
              <Pagination page={page} pages={pages}
                onPageChange={(p) => updateParam("page", String(p))} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-32" size="lg" />}>
      <ProductsContent />
    </Suspense>
  );
}

