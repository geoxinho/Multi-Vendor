"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/shared/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import SearchBar from "@/components/shared/SearchBar";
import { ProductSummary } from "@/types";

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-white rounded-md border border-[#E5E5E5] overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
            <div className="flex justify-between items-center pt-1">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-7 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface Category { _id: string; name: string; slug: string }

function ProductsContent() {
  const { data: session } = useSession();
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
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setCategories(d); }).catch(() => {});
  }, []);

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
        <h1 className="text-xl font-bold text-[#111111] uppercase tracking-wider">Products</h1>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA] text-[#111111] border border-[#E5E5E5] rounded-md font-medium text-sm"
        >
          <i className="fa-solid fa-filter text-xs" />
          Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className={`w-full lg:w-60 shrink-0 ${isFilterOpen ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-md border border-[#E5E5E5] p-5 space-y-6 sticky top-20">
            <div className="flex justify-between items-center pb-2 border-b border-[#E5E5E5]">
              <h2 className="font-bold text-[#111111] text-sm uppercase tracking-wider">Filters</h2>
              <button className="lg:hidden p-1 text-[#6B6B6B]" onClick={() => setIsFilterOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2">Condition</p>
              {["", "new", "used"].map((c) => (
                <button key={c}
                  onClick={() => updateParam("condition", c)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${condition === c ? "bg-[#fdf8e8] text-[#A4860E] font-semibold" : "text-[#6B6B6B] hover:bg-[#F5F5F5]"}`}>
                  {c === "" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2">Category</p>
                <button
                  onClick={() => updateParam("category", "")}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${!category ? "bg-[#fdf8e8] text-[#A4860E] font-semibold" : "text-[#6B6B6B] hover:bg-[#F5F5F5]"}`}>
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button key={cat._id}
                    onClick={() => updateParam("category", cat._id)}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors truncate ${category === cat._id ? "bg-[#fdf8e8] text-[#A4860E] font-semibold" : "text-[#6B6B6B] hover:bg-[#F5F5F5]"}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Sort */}
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2">Sort By</p>
              {[
                { value: "-createdAt", label: "Newest" },
                { value: "price", label: "Price: Low to High" },
                { value: "-price", label: "Price: High to Low" },
                { value: "-rating", label: "Top Rated" },
              ].map((s) => (
                <button key={s.value}
                  onClick={() => updateParam("sort", s.value)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm mb-1 transition-colors ${sort === s.value ? "bg-[#fdf8e8] text-[#A4860E] font-semibold" : "text-[#6B6B6B] hover:bg-[#F5F5F5]"}`}>
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
            <p className="text-sm text-[#6B6B6B]">
              {loading ? "Loading..." : `${total} product${total !== 1 ? "s" : ""} found`}
            </p>
            {(search || category || condition) && (
              <button
                onClick={() => router.push("/products")}
                className="text-sm text-[#DC2626] hover:underline font-medium">
                Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <ProductSkeletonGrid />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search terms."
              icon={<i className="fa-regular fa-face-frown text-5xl text-[#9B9B9B]" />}
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
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductSkeletonGrid />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
