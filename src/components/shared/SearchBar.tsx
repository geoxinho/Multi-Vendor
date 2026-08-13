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
        <i className="fa-solid fa-magnifying-glass absolute left-3 text-[#9B9B9B] text-xs pointer-events-none" />

        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hasSuggestions && setOpen(true)}
          placeholder="Search products..."
          className="w-full pl-9 pr-10 py-2 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-sm text-[#111111] placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#A4860E] focus:bg-white transition-colors"
        />

        <div className="absolute right-2 flex items-center justify-center">
          {loading ? (
            <i className="fa-solid fa-circle-notch animate-spin text-[#9B9B9B] text-sm" />
          ) : (
            <button type="submit" className="p-1 rounded text-[#9B9B9B] hover:text-[#A4860E] transition-colors flex items-center justify-center" aria-label="Search">
              <i className="fa-solid fa-magnifying-glass text-xs" />
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
                <button key={tag}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQ(tag); setOpen(false);
                    router.push(`/products?search=${encodeURIComponent(tag)}`);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    setQ(tag); setOpen(false);
                    router.push(`/products?search=${encodeURIComponent(tag)}`);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F5] text-left transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-magnifying-glass text-[10px] text-gray-500" />
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
                <button key={cat._id}
                  onMouseDown={(e) => { e.preventDefault(); goToCategory(cat._id, cat.name); }}
                  onTouchStart={(e) => { e.preventDefault(); goToCategory(cat._id, cat.name); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F5] text-left transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-[#fdf8e8] flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-tag text-[10px] text-[#A4860E]" />
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
                <button key={p._id}
                  onMouseDown={(e) => { e.preventDefault(); goToProduct(p._id); }}
                  onTouchStart={(e) => { e.preventDefault(); goToProduct(p._id); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F5F5F5] text-left transition-colors"
                >
                  <div className="relative w-8 h-8 rounded overflow-hidden bg-[#F5F5F5] shrink-0 border border-[#E5E5E5]">
                    {p.images[0] ? (
                      <Image src={p.images[0]} alt={p.title} fill className="object-cover" sizes="32px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D0D0D0]">
                        <i className="fa-solid fa-image text-xs" />
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
            <button
              onMouseDown={(e) => { e.preventDefault(); handleSubmit(e); }}
              onTouchStart={(e) => { e.preventDefault(); handleSubmit(e); }}
              className="w-full text-center text-sm text-[#A4860E] hover:underline font-medium py-1"
            >
              See all results for &ldquo;{q}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
