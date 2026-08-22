"use client";

import { useEffect, useState } from "react";

interface CountdownOrderItem {
  title: string;
  price: number;
  quantity: number;
  netPayout: number;
  seller: string;
}

interface CountdownOrder {
  _id: string;
  sellerPayoutReleaseAt: string;
  deliveredAt: string;
  payoutHeld: boolean;
  payoutHoldReason?: string;
  items: CountdownOrderItem[];
  totalAmount: number;
}

interface Props {
  order: CountdownOrder;
  sellerId: string;
}

const TOTAL_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

function formatTime(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

export default function PayoutCountdownCard({ order, sellerId }: Props) {
  const releaseAt = new Date(order.sellerPayoutReleaseAt).getTime();
  const deliveredAt = new Date(order.deliveredAt).getTime();

  const [remaining, setRemaining] = useState(() => Math.max(0, releaseAt - Date.now()));

  useEffect(() => {
    if (remaining === 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        const next = Math.max(0, releaseAt - Date.now());
        if (next === 0) clearInterval(id);
        return next;
      });
    }, 1_000);
    return () => clearInterval(id);
  }, [releaseAt]);

  // Seller net payout from this order
  const netPayout = order.items
    .filter((i) => i.seller === sellerId)
    .reduce((sum, i) => sum + (i.netPayout ?? i.price * i.quantity * 0.95), 0);

  // SVG donut chart
  const elapsed = TOTAL_MS - remaining;
  const progress = Math.min(1, elapsed / TOTAL_MS);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const { h, m, s } = formatTime(remaining);
  const isExpired = remaining === 0;

  return (
    <div
      className={`bg-white rounded-2xl border ${order.payoutHeld ? "border-amber-300 bg-amber-50" : "border-gray-100"} p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      {order.payoutHeld && (
        <div className="mb-3 flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-lg px-3 py-2">
          <i className="fa-solid fa-lock text-amber-600 text-xs" />
          <p className="text-xs text-amber-800 font-medium">
            Payout on hold — {order.payoutHoldReason || "Under review by admin"}
          </p>
        </div>
      )}

      <div className="flex items-center gap-5">
        {/* Donut countdown */}
        <div className="relative shrink-0 w-[88px] h-[88px]">
          <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
            {/* Track */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="10"
            />
            {/* Progress */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke={isExpired ? "#10b981" : order.payoutHeld ? "#f59e0b" : "#A4860E"}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.9s ease" }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            {isExpired ? (
              <>
                <i className="fa-solid fa-check text-emerald-500 text-lg" />
                <span className="text-[9px] font-bold text-emerald-600 mt-0.5">Done</span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-extrabold text-gray-800 leading-tight">
                  {h}:{m}
                </span>
                <span className="text-[8px] text-gray-400 leading-tight">:{s}</span>
                <span className="text-[8px] text-gray-400 leading-tight mt-0.5">left</span>
              </>
            )}
          </div>
        </div>

        {/* Order info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-gray-400 mb-1">
            #{order._id.slice(-10).toUpperCase()}
          </p>
          <p className="text-lg font-extrabold text-[#A4860E]">
            ₦{netPayout.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Net payout (after 5% fee)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Delivered:{" "}
            {new Date(order.deliveredAt).toLocaleString("en-NG", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Status badge */}
        <div className="shrink-0 text-right">
          {isExpired && !order.payoutHeld ? (
            <span className="badge bg-emerald-100 text-emerald-700 text-xs">
              <i className="fa-solid fa-clock-rotate-left mr-1" />
              Processing
            </span>
          ) : order.payoutHeld ? (
            <span className="badge bg-amber-100 text-amber-700 text-xs">
              <i className="fa-solid fa-lock mr-1" />
              On Hold
            </span>
          ) : (
            <span className="badge bg-[#fdf8e8] text-[#A4860E] border border-[#e8d48a] text-xs">
              <i className="fa-solid fa-hourglass-half mr-1" />
              Countdown
            </span>
          )}
        </div>
      </div>

      {/* Progress bar underneath */}
      {!isExpired && (
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Delivered</span>
            <span className="font-medium">{Math.round(progress * 100)}% elapsed</span>
            <span>Payout at 24 hrs</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${order.payoutHeld ? "bg-amber-400" : "bg-[#A4860E]"}`}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
