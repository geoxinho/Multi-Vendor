"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface Suggestion {
  categories: { _id: string; name: string; slug: string }[];
  products: { _id: string; title: string; price: number; images: string[] }[];
}

interface SearchBarProps {
  defaultValue?: string;
}

export default function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion>({ categories: [], products: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Fetch suggestions with debounce */
  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions({ categories: [], products: [] });
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.categories.length > 0 || data.products.length > 0);
      } catch {
        setSuggestions({ categories: [], products: [] });
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  useEffect(() => {
    fetchSuggestions(q);
  }, [q, fetchSuggestions]);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    if (q.trim()) router.push(`/products?search=${encodeURIComponent(q.trim())}`);
    else router.push("/products");
  };

  const goToCategory = (id: string, name: string) => {
    setQ(name);
    setOpen(false);
    router.push(`/products?category=${id}`);
  };

  const goToProduct = (id: string) => {
    setOpen(false);
    router.push(`/products/${id}`);
  };

  const hasSuggestions = suggestions.categories.length > 0 || suggestions.products.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        {/* Search icon */}
        <svg
          className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hasSuggestions && setOpen(true)}
          placeholder="Search products, categories..."
          className="w-full pl-9 pr-10 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
        />

        {/* Loading spinner or submit button */}
        <div className="absolute right-2">
          {loading ? (
            <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <button
              type="submit"
              className="p-1 rounded-md text-gray-500 hover:text-green-600 transition-colors"
              aria-label="Search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Suggestions dropdown */}
      {open && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">

          {/* Categories */}
          {suggestions.categories.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Categories
              </p>
              {suggestions.categories.map((cat) => (
                <button
                  key={cat._id}
                  onMouseDown={() => goToCategory(cat._id, cat.name)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-green-50 text-left transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-800 group-hover:text-green-700">{cat.name}</span>
                  <span className="ml-auto text-xs text-gray-400 group-hover:text-green-500">Browse →</span>
                </button>
              ))}
            </div>
          )}

          {/* Products */}
          {suggestions.products.length > 0 && (
            <div className={suggestions.categories.length > 0 ? "border-t border-gray-100" : ""}>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                Products
              </p>
              {suggestions.products.map((p) => (
                <button
                  key={p._id}
                  onMouseDown={() => goToProduct(p._id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="36px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.title}</p>
                    <p className="text-xs text-green-700 font-semibold">₦{p.price.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* View all results */}
          <div className="border-t border-gray-100 px-3 py-2">
            <button
              onMouseDown={handleSubmit as unknown as React.MouseEventHandler}
              className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium py-1"
            >
              See all results for &ldquo;{q}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
