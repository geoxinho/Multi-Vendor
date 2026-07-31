"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import RatingStars from "@/components/shared/RatingStars";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  buyer: { name: string; avatar?: string } | null;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
  } | null>(null);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${productId}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[FETCH_REVIEWS_ERROR]", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  // Check review eligibility for buyers
  useEffect(() => {
    if (session?.user?.role !== "buyer") return;
    fetch(`/api/reviews/eligible?productId=${productId}`)
      .then((r) => r.json())
      .then(setEligibility)
      .catch(() => setEligibility({ eligible: false, reason: "error" }));
  }, [session, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.comment.trim()) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSubmitting(false); return; }
    setSuccess(true);
    setForm({ rating: 5, comment: "" });
    setSubmitting(false);
    setEligibility({ eligible: false, reason: "already_reviewed" });
    fetchReviews();
  };

  const renderReviewPrompt = () => {
    if (!session) return null;

    if (session.user.role !== "buyer") return null;

    if (eligibility === null) return null; // still loading eligibility

    if (eligibility.reason === "already_reviewed" || success) {
      return (
        <div className="bg-[#F0FDF4] rounded-md border border-[#BBF7D0] p-5 mb-8 flex items-center gap-3">
          <i className="fa-solid fa-circle-check text-[#16A34A] text-2xl shrink-0" />
          <p className="text-[#16A34A] text-sm font-medium">You have already reviewed this product. Thank you!</p>
        </div>
      );
    }

    if (eligibility.reason === "no_delivered_order") {
      return (
        <div className="bg-[#FFFBEB] rounded-md border border-[#FEF3C7] p-5 mb-8">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-lock text-xl shrink-0 text-[#D97706] mt-0.5" />
            <div>
              <p className="text-[#D97706] font-semibold text-sm">Purchase required to review</p>
              <p className="text-[#D97706] text-xs mt-1 leading-relaxed">
                You can only review products you&apos;ve purchased and received. Your review option will appear in your{" "}
                <Link href="/dashboard/buyer/orders" className="underline font-medium">order history</Link>
                {" "}once your order is delivered.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (eligibility.eligible) {
      return (
        <div className="bg-white rounded-md border border-[#E5E5E5] p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-pen-to-square text-sm text-[#9B9B9B]" />
            <h3 className="font-semibold text-[#111111] text-sm uppercase tracking-wider">Write a Review</h3>
            <span className="badge bg-[#FAFAFA] text-[#6B6B6B] border border-[#E5E5E5] ml-auto">Verified Purchase</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                    className={`text-2xl transition-transform hover:scale-110 ${s <= form.rating ? "text-yellow-400" : "text-[#E5E5E5]"}`}>
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-[#6B6B6B] self-center">{form.rating}/5</span>
              </div>
            </div>
            <textarea rows={3} value={form.comment} required
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your honest experience — quality, delivery, packaging..."
              className="w-full px-4 py-3 rounded-md border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#2563EB] transition-colors resize-none bg-white text-[#111111] placeholder:text-[#9B9B9B]" />
            {error && <p className="text-sm text-[#DC2626] font-medium">{error}</p>}
            <button type="submit" disabled={submitting}
              className="px-5 py-2 bg-[#2563EB] text-white font-semibold rounded-md hover:bg-[#1D4ED8] transition-colors text-sm disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>
        </div>
      );
    }

    return null;
  };

  return (
    <section>
      <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-6 pb-2 border-b border-[#E5E5E5]">
        Customer Reviews <span className="text-[#9B9B9B] font-normal text-xs">({reviews.length})</span>
      </h2>

      {renderReviewPrompt()}

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-md p-8 text-center">
          <p className="text-[#9B9B9B] text-sm">No reviews yet. Be the first to review after receiving your order!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-md border border-[#E5E5E5] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <span className="text-[#2563EB] font-bold text-xs">{r.buyer?.name?.[0]?.toUpperCase() ?? "?"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111]">{r.buyer?.name ?? "Deleted User"}</p>
                  <p className="text-[10px] text-[#9B9B9B]">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="shrink-0">
                  <RatingStars rating={r.rating} size="sm" />
                </div>
              </div>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
