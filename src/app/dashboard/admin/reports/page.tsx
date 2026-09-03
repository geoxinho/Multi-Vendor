"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Report {
  _id: string;
  order: {
    _id: string;
    totalAmount: number;
    paymentStatus: string;
    deliveryStatus: string;
    deliveryPin?: string;
    payoutHeld: boolean;
    payoutHoldReason?: string;
    buyer?: { name: string; email: string; phone?: string; school?: string };
    items?: { title: string; price: number; quantity: number }[];
  };
  reportedBy: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    storeName?: string;
    school?: string;
  };
  reporterRole: "buyer" | "seller";
  reason: string;
  subject: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-red-100 text-red-700 border-red-200",
  investigating: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
  dismissed: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string; code?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchReports = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (schoolFilter !== "all") params.set("school", schoolFilter);

    const query = params.toString() ? `?${params.toString()}` : "";
    fetch(`/api/reports${query}`)
      .then((r) => r.json())
      .then((d) => {
        setReports(d.reports ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/schools?all=true")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setSchools(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchReports();
  }, [schoolFilter]);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    setSavingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchReports();
    } catch {
      alert("Failed to update status");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveNotes = async (reportId: string) => {
    setSavingId(reportId);
    const notes = editingNotes[reportId] ?? "";
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (res.ok) {
        alert("Admin notes saved successfully");
        fetchReports();
      }
    } catch {
      alert("Failed to save notes");
    } finally {
      setSavingId(null);
    }
  };

  const handleTogglePayoutHold = async (report: Report) => {
    const shouldHold = !report.order.payoutHeld;
    const reason = shouldHold
      ? prompt("Enter payout hold reason:", `Hold due to complaint: ${report.reason}`)
      : "";

    if (shouldHold && reason === null) return;
    if (!shouldHold && !confirm("Release the payout hold on this order?")) return;

    setSavingId(report._id);
    try {
      const res = await fetch(`/api/admin/reports/${report._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          togglePayoutHold: shouldHold,
          payoutHoldReason: reason || "",
        }),
      });
      if (res.ok) fetchReports();
    } catch {
      alert("Failed to update payout hold status");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = reports.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (roleFilter !== "all" && r.reporterRole !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.subject.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.reportedBy?.name?.toLowerCase().includes(q) ||
        r.reportedBy?.email?.toLowerCase().includes(q) ||
        r.order?._id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const investigatingCount = reports.filter((r) => r.status === "investigating").length;

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <i className="fa-solid fa-triangle-exclamation text-red-600" />
            Order Complaints &amp; Disputes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review delivery abnormalities, customer complaints, damaged goods disputes, and resolve issues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium text-gray-700 shadow-2xs"
          >
            <option value="all">All Campuses</option>
            {schools.map((s) => (
              <option key={s._id} value={s.name}>
                {s.name} {s.code ? `(${s.code})` : ""}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search by subject, buyer, order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 w-64 bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Complaints", count: reports.length },
            { id: "pending", label: "Pending", count: pendingCount },
            { id: "investigating", label: "Investigating", count: investigatingCount },
            { id: "resolved", label: "Resolved", count: reports.filter((r) => r.status === "resolved").length },
            { id: "dismissed", label: "Dismissed", count: reports.filter((r) => r.status === "dismissed").length },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-white text-gray-700"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider">Reporter:</span>
          {["all", "buyer", "seller"].map((rf) => (
            <button
              key={rf}
              onClick={() => setRoleFilter(rf)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                roleFilter === rf
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {rf === "all" ? "All" : rf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-32" size="lg" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
          <i className="fa-solid fa-circle-check text-4xl mb-3 text-emerald-500 block" />
          <h3 className="font-bold text-gray-800 text-base mb-1">No Complaints Found</h3>
          <p className="text-xs">There are no reports matching this filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => (
            <div
              key={report._id}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4 hover:border-gray-300 transition"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-base">{report.subject}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${STATUS_BADGE[report.status]}`}>
                      {report.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      report.reporterRole === "buyer" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}>
                      Reported by {report.reporterRole}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Filed on {new Date(report.createdAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })} &bull; Category: <strong className="text-gray-700">{report.reason}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/dashboard/admin/orders/${report.order?._id}`}
                    className="px-3 py-1.5 bg-[#fdf8e8] hover:bg-[#f6ebc4] text-[#A4860E] border border-[#e8d48a] font-bold text-xs rounded-xl transition"
                  >
                    View Order #{report.order?._id?.slice(-8).toUpperCase()} &rarr;
                  </Link>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Reporter Info */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px] mb-1 text-gray-500">
                    <i className="fa-solid fa-user mr-1" /> Reporter Details
                  </p>
                  <p className="font-bold text-gray-900">{report.reportedBy?.name || "User"}</p>
                  <p className="text-gray-600">{report.reportedBy?.email}</p>
                  {report.reportedBy?.phone && <p className="text-gray-600">Phone: {report.reportedBy?.phone}</p>}
                  {report.reportedBy?.school && (
                    <p className="text-[#A4860E] font-medium flex items-center gap-1 mt-1">
                      <i className="fa-solid fa-graduation-cap" /> {report.reportedBy?.school}
                    </p>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px] mb-1 text-gray-500">
                    <i className="fa-solid fa-receipt mr-1" /> Order Status
                  </p>
                  <div className="flex justify-between text-gray-700">
                    <span>Total Amount:</span>
                    <span className="font-bold">₦{report.order?.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Delivery Status:</span>
                    <span className="font-bold capitalize">{report.order?.deliveryStatus}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Payout Held:</span>
                    <span className={`font-bold ${report.order?.payoutHeld ? "text-red-600" : "text-green-600"}`}>
                      {report.order?.payoutHeld ? "YES (HELD)" : "NO"}
                    </span>
                  </div>
                </div>

                {/* Status & Payout Actions */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                  <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px] text-gray-500">
                    <i className="fa-solid fa-sliders mr-1" /> Admin Action
                  </p>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1 font-semibold">Change Report Status:</label>
                    <select
                      value={report.status}
                      disabled={savingId === report._id}
                      onChange={(e) => handleUpdateStatus(report._id, e.target.value)}
                      className="w-full text-xs font-bold border border-gray-200 rounded-lg p-1.5 bg-white focus:outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleTogglePayoutHold(report)}
                    disabled={savingId === report._id}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold border transition ${
                      report.order?.payoutHeld
                        ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    {report.order?.payoutHeld ? "Release Seller Payout" : "Hold Seller Payout"}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="bg-red-50/40 p-4 rounded-xl border border-red-100 text-xs text-gray-800 leading-relaxed">
                <p className="font-bold text-red-900 mb-1 text-[11px] uppercase tracking-wider">
                  Dispute Description:
                </p>
                <p className="whitespace-pre-line">{report.description}</p>
              </div>

              {/* Admin Notes Section */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Administrative Notes &amp; Findings:</label>
                  <button
                    onClick={() => handleSaveNotes(report._id)}
                    disabled={savingId === report._id}
                    className="text-xs text-[#A4860E] hover:text-[#8a7009] font-bold"
                  >
                    Save Notes
                  </button>
                </div>
                <textarea
                  rows={2}
                  defaultValue={report.adminNotes || ""}
                  onChange={(e) =>
                    setEditingNotes((prev) => ({ ...prev, [report._id]: e.target.value }))
                  }
                  placeholder="Record investigation findings, resolution details, or action taken..."
                  className="w-full text-xs p-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#A4860E] resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
