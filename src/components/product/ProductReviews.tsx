"use client";

import { useEffect, useState, useCallback } from "react";
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

interface EligibilityData {
  eligible: boolean;
  reason?: string;
  deliveredCount?: number;
  reviewsCount?: number;
  remainingReviews?: number;
  purchaseIndex?: number;
}

export default function ProductReviews({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchReviews = useCallback(async () => {
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
  }, [productId]);

  const checkEligibility = useCallback(() => {
    if (session?.user?.role !== "buyer") return;
    fetch(`/api/reviews/eligible?productId=${productId}`)
      .then((r) => r.json())
      .then(setEligibility)
      .catch(() => setEligibility({ eligible: false, reason: "error" }));
  }, [session, productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.comment.trim()) return;
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit review");
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setForm({ rating: 5, comment: "" });
      setSubmitting(false);
      fetchReviews();
      checkEligibility();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const renderReviewPrompt = () => {
    if (!session) return null;
    if (session.user.role !== "buyer") return null;
    if (eligibility === null) return null; // loading eligibility

    if (eligibility.reason === "already_reviewed" || (success && !eligibility.eligible)) {
      return (
        <div className="bg-[#fdf8e8] rounded-xl border border-[#e8d48a] p-5 mb-8 flex items-start gap-3">
          <i className="fa-solid fa-circle-check text-[#A4860E] text-2xl shrink-0 mt-0.5" />
          <div>
            <p className="text-[#A4860E] text-sm font-bold">
              You have reviewed all your delivered purchases for this product!
            </p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              If you purchase this item again in the future, you will automatically be able to leave another review for your new order. Thank you for your feedback!
            </p>
          </div>
        </div>
      );
    }

    if (eligibility.reason === "no_delivered_order") {
      return (
        <div className="bg-[#FFFBEB] rounded-xl border border-[#FEF3C7] p-5 mb-8">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-lock text-xl shrink-0 text-[#D97706] mt-0.5" />
            <div>
              <p className="text-[#D97706] font-bold text-sm">Delivered purchase required to review</p>
              <p className="text-[#D97706] text-xs mt-1 leading-relaxed">
                You can review this product once you receive your order and delivery is confirmed. Check your{" "}
                <Link href="/dashboard/buyer/orders" className="underline font-bold">Order History</Link>
                {" "}for status updates.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (eligibility.eligible) {
      const isRepeatBuyer = (eligibility.reviewsCount ?? 0) > 0;

      return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-pen-to-square text-sm text-[#A4860E]" />
            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider">
              {isRepeatBuyer
                ? `Write a Review (Purchase #${(eligibility.reviewsCount ?? 0) + 1})`
                : "Write a Customer Review"}
            </h3>
            <span className="badge bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a] text-xs font-bold ml-auto flex items-center gap-1">
              <i className="fa-solid fa-check text-[10px]" />
              {isRepeatBuyer ? "Repeat Verified Purchase" : "Verified Purchase"}
            </span>
          </div>

          {isRepeatBuyer && (
            <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <i className="fa-solid fa-rotate text-[#A4860E] mr-1.5" />
              You purchased this product again! Share your experience with your latest delivery.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Your Rating</p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      s <= form.rating ? "text-amber-400" : "text-gray-200"
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-gray-700">{form.rating} / 5</span>
              </div>
            </div>
            <textarea
              rows={3}
              value={form.comment}
              required
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your honest experience — quality, condition, delivery speed..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E] transition-all resize-none bg-white text-gray-900 placeholder:text-gray-400"
            />
            {error && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                <i className="fa-solid fa-circle-exclamation" />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#A4860E] hover:bg-[#8a7009] text-white font-bold rounded-xl transition-all text-sm disabled:opacity-60 shadow-sm flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </form>
        </div>
      );
    }

    return null;
  };

  return (
    <section id="reviews" className="scroll-mt-24">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100 flex items-center justify-between">
        <span>
          Customer Reviews <span className="text-gray-400 font-normal text-xs">({reviews.length})</span>
        </span>
      </h2>

      {renderReviewPrompt()}

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to review after receiving your order!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#fdf8e8] border border-[#e8d48a] flex items-center justify-center shrink-0">
                  <span className="text-[#A4860E] font-bold text-xs">
                    {r.buyer?.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {r.buyer?.name ?? "Campus Buyer"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="shrink-0">
                  <RatingStars rating={r.rating} size="sm" />
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
