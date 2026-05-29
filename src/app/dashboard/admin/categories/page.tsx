"use client";

import { useEffect, useState, useRef } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Image from "next/image";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { setCategories(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("files", files[0]);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.urls?.[0]) setImageUrl(data.urls[0]);
    setUploading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), image: imageUrl }),
    });
    setName(""); setImageUrl("");
    setCreating(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCategories();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Categories</h1>

      {/* Create form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Add Category</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input type="text" required value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electronics"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image (optional)</label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100">
                  <Image src={imageUrl} alt="Category" fill className="object-cover" />
                </div>
              )}
              <button type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-500 transition-colors">
                {uploading ? "Uploading..." : "Upload Image"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)} />
            </div>
          </div>
          <button type="submit" disabled={creating || uploading}
            className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60">
            {creating ? "Creating..." : "Add Category"}
          </button>
        </form>
      </div>

      {/* Categories list */}
      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {categories.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm text-center">No categories yet. Add one above.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat._id} className="flex items-center gap-4 px-5 py-4">
                {cat.image ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-50">
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-tag text-green-500 text-lg" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{cat.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                </div>
                <button onClick={() => handleDelete(cat._id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
