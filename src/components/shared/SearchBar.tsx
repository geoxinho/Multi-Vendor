"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface Suggestion {
  categories: { _id: string; name: string; slug: string }[];
  products: { _id: string; title: string; price: number; images: string[] }[];
  tags: string[];
}

interface SearchBarProps {
  defaultValue?: string;
}

export default function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion>({ categories: [], products: [], tags: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions({ categories: [], products: [], tags: [] });
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.categories.length > 0 || data.products.length > 0 || data.tags.length > 0);
      } catch {
        setSuggestions({ categories: [], products: [], tags: [] });
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  useEffect(() => { fetchSuggestions(q); }, [q, fetchSuggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
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
    setQ(name); setOpen(false);
    router.push(`/products?category=${id}`);
  };

  const goToProduct = (id: string) => {
    setOpen(false);
    router.push(`/products/${id}`);
  };

  const hasSuggestions = suggestions.categories.length > 0 || suggestions.products.length > 0 || suggestions.tags.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <svg className="absolute left-3 w-4 h-4 text-[#9B9B9B] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hasSuggestions && setOpen(true)}
          placeholder="Search products..."
          className="w-full pl-9 pr-10 py-2 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-colors"
        />

        <div className="absolute right-2">
          {loading ? (
            <svg className="w-4 h-4 text-[#9B9B9B] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <button type="submit" className="p-1 rounded text-[#9B9B9B] hover:text-[#2563EB] transition-colors" aria-label="Search">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {open && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-md z-50 overflow-hidden">
          {suggestions.tags.length > 0 && (
            <div>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-[#9B9B9B] uppercase tracking-widest">Search Tags</p>
              {suggestions.tags.map((tag) => (
                <button key={tag} onMouseDown={() => {
                  setQ(tag); setOpen(false);
                  router.push(`/products?search=${encodeURIComponent(tag)}`);
                }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F5] text-left transition-colors">
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-[#111111]">{tag}</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.categories.length > 0 && (
            <div className={suggestions.tags.length > 0 ? "border-t border-[#E5E5E5]" : ""}>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-[#9B9B9B] uppercase tracking-widest">Categories</p>
              {suggestions.categories.map((cat) => (
                <button key={cat._id} onMouseDown={() => goToCategory(cat._id, cat.name)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F5] text-left transition-colors">
                  <div className="w-6 h-6 rounded bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#111111]">{cat.name}</span>
                  <span className="ml-auto text-xs text-[#9B9B9B]">Browse →</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.products.length > 0 && (
            <div className={suggestions.categories.length > 0 || suggestions.tags.length > 0 ? "border-t border-[#E5E5E5]" : ""}>
              <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-[#9B9B9B] uppercase tracking-widest">Products</p>
              {suggestions.products.map((p) => (
                <button key={p._id} onMouseDown={() => goToProduct(p._id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F5] text-left transition-colors">
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-[#F5F5F5] shrink-0 border border-[#E5E5E5]">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="32px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D0D0D0]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111111] truncate">{p.title}</p>
                    <p className="text-xs text-[#6B6B6B] font-medium">₦{p.price.toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-[#E5E5E5] px-3 py-2">
            <button onMouseDown={handleSubmit as unknown as React.MouseEventHandler}
              className="w-full text-center text-sm text-[#2563EB] hover:underline font-medium py-1">
              See all results for &ldquo;{q}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
