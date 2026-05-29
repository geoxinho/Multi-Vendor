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
  buyer: { name: string; avatar?: string };
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
    const res = await fetch(`/api/reviews/${productId}`);
    const data = await res.json();
    setReviews(Array.isArray(data) ? data : []);
    setLoading(false);
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
    if (!session) {
      return (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 mb-8 text-center">
          <p className="text-gray-600 text-sm mb-3">
            <Link href="/auth/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
            {" "}to leave a review. Only verified buyers who received delivery can review.
          </p>
        </div>
      );
    }

    if (session.user.role !== "buyer") return null;

    if (eligibility === null) return null; // still loading eligibility

    if (eligibility.reason === "already_reviewed" || success) {
      return (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-5 mb-8 flex items-center gap-3">
          <i className="fa-solid fa-circle-check text-green-600 text-2xl shrink-0" />
          <p className="text-green-700 text-sm font-medium">You have already reviewed this product. Thank you!</p>
        </div>
      );
    }

    if (eligibility.reason === "no_delivered_order") {
      return (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5 mb-8">
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-lock text-2xl shrink-0 text-amber-600" />
            <div>
              <p className="text-amber-800 font-semibold text-sm">Purchase required to review</p>
              <p className="text-amber-700 text-xs mt-1">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-pen-to-square text-lg text-gray-500" />
            <h3 className="font-semibold text-gray-900">Write a Review</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-auto">Verified Purchase</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Your Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: s }))}
                    className={`text-3xl transition-transform hover:scale-110 ${s <= form.rating ? "text-yellow-400" : "text-gray-200"}`}>
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500 self-center">{form.rating}/5</span>
              </div>
            </div>
            <textarea rows={3} value={form.comment} required
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your honest experience — quality, delivery, packaging..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60">
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
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Customer Reviews <span className="text-gray-400 font-normal text-base">({reviews.length})</span>
      </h2>

      {renderReviewPrompt()}

      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to review after receiving your order!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="text-green-700 font-bold text-sm">{r.buyer.name?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.buyer.name}</p>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="shrink-0">
                  <RatingStars rating={r.rating} size="sm" />
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
