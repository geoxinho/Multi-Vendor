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
    tags?: string[];
    status?: string;
    variants?: { sizes: string[]; colors: string[] };
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
    tags: initialData.tags ?? ([] as string[]),
    status: initialData.status ?? "active",
    variants: {
      sizes: initialData.variants?.sizes ?? ([] as string[]),
      colors: initialData.variants?.colors ?? ([] as string[]),
    },
  });

  const [tagInput, setTagInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [colorInput, setColorInput] = useState("");

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
      tags: form.tags,
      variants: form.variants,
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

  const addTag = (raw: string) => {
    const newTag = raw.trim().toLowerCase().replace(/,$/, "");
    if (newTag && !form.tags.includes(newTag)) {
      if (form.tags.length >= 15) {
        setError("Maximum 15 tags allowed");
        return;
      }
      setForm((f) => ({ ...f, tags: [...f.tags, newTag] }));
      setError("");
    }
    setTagInput("");
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(",")) {
      addTag(val);
    } else {
      setTagInput(val);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tagToRemove) }));
    setError("");
  };

  // ── Variants helpers ────────────────────────────────────────────
  const VARIANT_KEYWORDS = ["cloth", "fashion", "wear", "shoe", "sneaker", "boot", "apparel", "dress", "shirt", "trouser", "jean", "top", "skirt", "jacket", "hoodie", "bag", "hat", "cap", "accessories"];

  const selectedCategoryName = categories.find((c) => c._id === form.category)?.name?.toLowerCase() ?? "";
  const showVariants = VARIANT_KEYWORDS.some((kw) => selectedCategoryName.includes(kw));

  const addVariantChip = (type: "sizes" | "colors", raw: string) => {
    const val = raw.trim().replace(/,$/, "");
    if (!val) return;
    setForm((f) => ({
      ...f,
      variants: {
        ...f.variants,
        [type]: f.variants[type].includes(val) ? f.variants[type] : [...f.variants[type], val],
      },
    }));
    if (type === "sizes") setSizeInput("");
    else setColorInput("");
  };

  const removeVariantChip = (type: "sizes" | "colors", val: string) => {
    setForm((f) => ({
      ...f,
      variants: { ...f.variants, [type]: f.variants[type].filter((v) => v !== val) },
    }));
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
                ? "border-[#A4860E] bg-[#fdf8e8] scale-[1.01]"
                : "border-gray-200 hover:border-[#A4860E]/50 hover:bg-gray-50"
            }`}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${dragging ? "bg-[#fdf8e8]" : "bg-gray-100"}`}>
              <i className={`fa-solid fa-image text-2xl ${dragging ? "text-[#A4860E]" : "text-gray-400"}`} />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {dragging ? "Drop to add images" : "Drag & drop images here"}
            </p>
            <p className="text-xs text-gray-400 mt-1">or <span className="text-[#A4860E] font-medium">click to browse</span> — JPG, PNG, WEBP (max 8)</p>
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
                  <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-[#A4860E] text-white px-2 py-0.5 rounded-full font-semibold">Cover</span>
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
                    <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-[#A4860E] text-white px-2 py-0.5 rounded-full font-semibold">Cover</span>
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E] transition" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea rows={4} required value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe your product in detail — condition, specs, what's included..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E] transition resize-none" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Search Tags (Optional)</label>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${form.tags.length >= 15 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
              {form.tags.length}/15
            </span>
          </div>
          
          <div className={`w-full p-2 min-h-[52px] rounded-xl border bg-white focus-within:ring-2 focus-within:ring-[#A4860E] transition flex flex-wrap gap-2 items-center ${form.tags.length >= 15 ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
            {form.tags.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#fdf8e8] text-[#A4860E] text-sm font-medium border border-[#e8d48a] shadow-sm">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="text-[#A4860E] hover:text-[#8a7009] transition-colors focus:outline-none flex items-center justify-center">
                  <i className="fa-solid fa-xmark text-[10px]" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={handleTagChange}
              onKeyDown={handleTagKeyDown}
              disabled={form.tags.length >= 15}
              placeholder={form.tags.length === 0 ? "e.g. iphone, apple" : form.tags.length >= 15 ? "Maximum tags reached" : "Add another tag..."}
              className="flex-1 min-w-[100px] bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed placeholder-gray-400"
            />
            {tagInput.trim() && form.tags.length < 15 && (
              <button
                type="button"
                onClick={() => addTag(tagInput)}
                className="shrink-0 px-3 py-1 rounded-lg text-xs font-bold text-white transition-colors"
                style={{ background: "#A4860E" }}
              >
                Add
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Tags are hidden from buyers but boost search. Type a tag and press <strong>Enter</strong>, tap <strong>Add</strong>, or type a comma.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₦)</label>
            <input type="number" required min={0} value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="5000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
            <input type="number" required min={1} value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
            <select value={form.condition}
              onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value as "new" | "used" }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition bg-white">
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            {categoriesLoading ? (
              <div className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-50 flex items-center gap-2">
                <i className="fa-solid fa-circle-notch animate-spin" />
                Loading…
              </div>
            ) : categories.length === 0 ? (
              <div className="w-full px-4 py-3 rounded-xl border border-amber-200 text-sm text-amber-700 bg-amber-50">
                No categories yet — an admin needs to create them first.
              </div>
            ) : (
              <select required value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition bg-white">
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* ── Variants: Size & Colour (shown only for fashion/shoe categories) ── */}
        {showVariants && (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">Product Variants</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: "#A4860E" }}>
                Sizes &amp; Colours
              </span>
            </div>

            {/* Sizes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Sizes</label>
              <div className="w-full p-2 min-h-[48px] rounded-xl border border-gray-200 bg-white flex flex-wrap gap-2 items-center focus-within:border-[#A4860E] transition">
                {form.variants.sizes.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border text-white" style={{ background: "#A4860E", borderColor: "#8a6f0b" }}>
                    {s}
                    <button type="button" onClick={() => removeVariantChip("sizes", s)} className="opacity-80 hover:opacity-100 focus:outline-none">
                      <i className="fa-solid fa-xmark text-[10px]" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={sizeInput}
                  onChange={(e) => { const v = e.target.value; if (v.endsWith(",")) { addVariantChip("sizes", v); } else { setSizeInput(v); } }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addVariantChip("sizes", sizeInput); } }}
                  placeholder="e.g. S, M, L, XL, 42"
                  className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none placeholder-gray-400"
                />
                {sizeInput.trim() && (
                  <button type="button" onClick={() => addVariantChip("sizes", sizeInput)} className="shrink-0 px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: "#A4860E" }}>Add</button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Type a size and press Enter, tap Add, or use commas.</p>
            </div>

            {/* Colours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Colours</label>
              <div className="w-full p-2 min-h-[48px] rounded-xl border border-gray-200 bg-white flex flex-wrap gap-2 items-center focus-within:border-[#A4860E] transition">
                {form.variants.colors.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold border border-gray-200 bg-gray-50 text-gray-800">
                    {c}
                    <button type="button" onClick={() => removeVariantChip("colors", c)} className="text-gray-400 hover:text-gray-700 focus:outline-none">
                      <i className="fa-solid fa-xmark text-[10px]" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={colorInput}
                  onChange={(e) => { const v = e.target.value; if (v.endsWith(",")) { addVariantChip("colors", v); } else { setColorInput(v); } }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addVariantChip("colors", colorInput); } }}
                  placeholder="e.g. Red, Black, Navy Blue"
                  className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none placeholder-gray-400"
                />
                {colorInput.trim() && (
                  <button type="button" onClick={() => addVariantChip("colors", colorInput)} className="shrink-0 px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ background: "#A4860E" }}>Add</button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">Type a colour and press Enter, tap Add, or use commas.</p>
            </div>
          </div>
        )}

        {mode === "edit" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Status</label>
            <select value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none transition bg-white">
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
          className="px-8 py-3 bg-[#A4860E] text-white font-semibold rounded-xl hover:bg-[#8a7009] transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {loading && (
            <i className="fa-solid fa-circle-notch animate-spin" />
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
