"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { productSchema } from "@/utils/validators";

interface Category { _id: string; name: string }

interface ProductFormProps {
  initialData?: {
    _id?: string;
    title?: string;
    description?: string;
    price?: number;
    condition?: "new" | "used";
    category?: string;
    stock?: number;
    images?: string[];
    status?: string;
  };
  mode: "create" | "edit";
}

interface PendingImage {
  file: File;
  preview: string;
}

export default function ProductForm({ initialData = {}, mode }: ProductFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: initialData.title ?? "",
    description: initialData.description ?? "",
    price: initialData.price ?? ("" as number | string),
    condition: (initialData.condition ?? "new") as "new" | "used",
    category: initialData.category ?? "",
    stock: initialData.stock ?? 1,
    status: initialData.status ?? "active",
  });

  // Already-uploaded image URLs (Cloudinary)
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData.images ?? []);
  // Local files waiting to be uploaded on submit
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())

      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setCategoriesLoading(false);
      })
      .catch(() => setCategoriesLoading(false));
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      pendingImages.forEach((p) => URL.revokeObjectURL(p.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    const total = uploadedImages.length + pendingImages.length + imageFiles.length;
    const allowed = imageFiles.slice(0, Math.max(0, 8 - (uploadedImages.length + pendingImages.length)));
    if (total > 8) setUploadError("Maximum 8 images allowed. Some images were skipped.");
    else setUploadError("");
    const newPending: PendingImage[] = allowed.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...newPending]);
  }, [uploadedImages.length, pendingImages.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removePending = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
    setUploadError("");
  };

  const removeUploaded = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUploadError("");

    let newUrls: string[] = [];

    // Step 1: Upload pending images
    if (pendingImages.length > 0) {
      setLoading(true);
      setLoadingMsg(`Uploading ${pendingImages.length} image${pendingImages.length > 1 ? "s" : ""}…`);
      const formData = new FormData();
      pendingImages.forEach((p) => formData.append("files", p.file));

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.urls) {
        setUploadError(
          uploadData.error ??
          "Image upload failed. Make sure your Cloudinary keys are set in .env.local."
        );
        setLoading(false);
        setLoadingMsg("");
        return;
      }
      newUrls = uploadData.urls;
    }

    const allImages = [...uploadedImages, ...newUrls];

    // Step 2: Validate and save product
    setLoadingMsg("Saving product…");
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      images: allImages,
    };

    const parsed = productSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      setLoading(false);
      setLoadingMsg("");
      return;
    }

    setLoading(true);
    const url = mode === "create" ? "/api/products" : `/api/products/${initialData._id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...parsed.data, status: form.status }),
    });
    const data = await res.json();
    setLoading(false);
    setLoadingMsg("");

    if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
    router.push("/dashboard/seller/products");
    router.refresh();
  };

  const totalImages = uploadedImages.length + pendingImages.length;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

      {/* ── Images ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Product Images</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${totalImages >= 8 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
            {totalImages}/8
          </span>
        </div>

        {/* Drop zone */}
        {totalImages < 8 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`mb-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragging
                ? "border-green-400 bg-green-50 scale-[1.01]"
                : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
            }`}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${dragging ? "bg-green-100" : "bg-gray-100"}`}>
              <svg className={`w-6 h-6 ${dragging ? "text-green-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {dragging ? "Drop to add images" : "Drag & drop images here"}
            </p>
            <p className="text-xs text-gray-400 mt-1">or <span className="text-green-600 font-medium">click to browse</span> — JPG, PNG, WEBP (max 8)</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Image grid */}
        {totalImages > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {uploadedImages.map((url, i) => (
              <div key={`up-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group">
                <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeUploaded(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                >×</button>
                {i === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">Cover</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUploadedImages((prev) => [prev[i], ...prev.filter((_, j) => j !== i)])}
                    className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >Set Cover</button>
                )}
              </div>
            ))}

            {pendingImages.map((p, i) => {
              const globalIndex = uploadedImages.length + i;
              return (
                <div key={`pend-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-amber-300 group">
                  <Image src={p.preview} alt={`Preview ${i + 1}`} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button
                    type="button"
                    onClick={() => removePending(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                  >×</button>
                  {globalIndex === 0 ? (
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-semibold">Cover</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (uploadedImages.length === 0) {
                          // Promote pending image to first pending slot
                          setPendingImages((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);
                        } else {
                          // Move uploaded[0] to end, make this pending the cover by moving uploaded images around
                          // Simplest: move this pending to front of pending (it will be uploaded first)
                          setPendingImages((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);
                        }
                      }}
                      className="absolute bottom-1.5 left-1.5 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >Set Cover</button>
                  )}
                  <span className="absolute top-1.5 left-1.5 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-semibold">New</span>
                </div>
              );
            })}
          </div>
        )}


        {totalImages === 0 && (
          <p className="text-center text-sm text-gray-400 mt-2">No images added yet. The first image will be the cover.</p>
        )}

        {uploadError && (
          <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
            <i className="fa-solid fa-triangle-exclamation shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* ── Details ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Product Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
          <input type="text" required value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. iPhone 13 Pro Max 256GB"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea rows={4} required value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe your product in detail — condition, specs, what's included..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₦)</label>
            <input type="number" required min={0} value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="5000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
            <input type="number" required min={1} value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
            <select value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as "new" | "used" }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white">
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            {categoriesLoading ? (
              <div className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Loading…
              </div>
            ) : categories.length === 0 ? (
              <div className="w-full px-4 py-3 rounded-xl border border-amber-200 text-sm text-amber-700 bg-amber-50">
                No categories yet — an admin needs to create them first.
              </div>
            ) : (
              <select required value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white">
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {mode === "edit" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Status</label>
            <select value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition bg-white">
              <option value="active">Active — visible to buyers</option>
              <option value="inactive">Inactive — hidden from buyers</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
          <i className="fa-solid fa-triangle-exclamation shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || categoriesLoading}
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {loading && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          {loading ? loadingMsg || "Saving…" : mode === "create" ? "List Product" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
