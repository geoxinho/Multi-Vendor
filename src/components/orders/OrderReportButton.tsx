"use client";

import { useState } from "react";
import ReportOrderModal from "./ReportOrderModal";

interface OrderReportButtonProps {
  orderId: string;
  role: "buyer" | "seller";
  className?: string;
  hasActiveReport?: boolean;
}

export default function OrderReportButton({
  orderId,
  role,
  className,
  hasActiveReport = false,
}: OrderReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(hasActiveReport);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          `flex items-center gap-2 justify-center w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors ${
            reported
              ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          }`
        }
      >
        <i className="fa-solid fa-triangle-exclamation text-xs" />
        <span>{reported ? "Dispute Lodged / Report Status" : "Report Issue to Admin"}</span>
      </button>

      {open && (
        <ReportOrderModal
          orderId={orderId}
          role={role}
          onClose={() => setOpen(false)}
          onSuccess={() => setReported(true)}
        />
      )}
    </>
  );
}
