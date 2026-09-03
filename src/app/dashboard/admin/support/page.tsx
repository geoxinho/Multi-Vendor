"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Ticket = {
  _id: string;
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  orderId?: string;
  message: string;
  isLoggedIn: boolean;
  userId?: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-50 text-red-700 border border-red-200",
  in_progress: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  resolved: "bg-green-50 text-green-700 border border-green-200",
  closed: "bg-gray-100 text-gray-500 border border-gray-200",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/support?${params}`);
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [page, statusFilter]);

  const openTicket = (t: Ticket) => {
    setSelectedTicket(t);
    setAdminNote(t.adminNote ?? "");
    setSaveMsg("");
  };

  const closeDetail = () => { setSelectedTicket(null); setSaveMsg(""); };

  const handleSave = async (newStatus: string) => {
    if (!selectedTicket) return;
    setSaving(true);
    const res = await fetch("/api/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: selectedTicket.ticketId, status: newStatus, adminNote }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setSaveMsg("✅ Saved successfully");
      setSelectedTicket({ ...data });
      setTickets((prev) =>
        prev.map((t) => (t.ticketId === data.ticketId ? { ...data } : t))
      );
    } else {
      setSaveMsg("❌ Failed to save. Try again.");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <i className="fa-solid fa-headset text-[#A4860E]" />
            Support Messages
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            All help desk tickets submitted by users from the{" "}
            <Link href="/help" target="_blank" className="text-[#A4860E] hover:underline">
              /help
            </Link>{" "}
            page.
          </p>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          {total} ticket{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => { setPage(1); setStatusFilter(s); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              statusFilter === s
                ? "bg-[#A4860E] text-white border-[#A4860E]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#A4860E] hover:text-[#A4860E]"
            }`}
          >
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <i className="fa-solid fa-circle-notch animate-spin text-2xl mb-3 block" />
          <p className="text-sm">Loading tickets…</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <i className="fa-solid fa-inbox text-4xl mb-3 block" />
          <p className="text-sm font-medium">No tickets found</p>
          <p className="text-xs mt-1">Support messages from the /help page will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              onClick={() => openTicket(ticket)}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm hover:border-[#e8d48a] transition cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${ticket.isLoggedIn ? "fa-user-check" : "fa-user"} text-purple-600 text-sm`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{ticket.name}</span>
                    {ticket.isLoggedIn && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded-full border border-blue-100 font-bold">Registered User</span>
                    )}
                    <span
                      className={`ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[ticket.status]}`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{ticket.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ticket.message}</p>
                  <div className="flex gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                    <span><i className="fa-solid fa-tag mr-1" />{ticket.category}</span>
                    <span><i className="fa-solid fa-envelope mr-1" />{ticket.email}</span>
                    {ticket.orderId && <span><i className="fa-solid fa-box mr-1" />#{ticket.orderId}</span>}
                    <span><i className="fa-solid fa-ticket mr-1" />{ticket.ticketId}</span>
                    <span className="ml-auto">
                      {new Date(ticket.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Ticket Detail Modal ── */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900 text-base">{selectedTicket.ticketId}</h2>
                <p className="text-xs text-gray-500">{selectedTicket.category} · {selectedTicket.isLoggedIn ? "Registered User" : "Visitor"}</p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-700 transition">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
              {/* Sender */}
              <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
                <i className="fa-solid fa-user text-gray-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selectedTicket.name}</p>
                  <a href={`mailto:${selectedTicket.email}`} className="text-xs text-[#A4860E] hover:underline">{selectedTicket.email}</a>
                  {selectedTicket.orderId && (
                    <p className="text-xs text-gray-500 mt-0.5">Order: <span className="font-mono">#{selectedTicket.orderId}</span></p>
                  )}
                </div>
              </div>

              {/* Subject & Message */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm font-semibold text-gray-900">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Message</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Admin Note */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Admin Note (internal)
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Add internal notes about this ticket…"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A4860E] focus:ring-1 focus:ring-[#A4860E]/20 resize-none"
                />
              </div>

              {saveMsg && (
                <p className={`text-xs font-semibold ${saveMsg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                  {saveMsg}
                </p>
              )}
            </div>

            {/* Modal Footer — Status Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2">
              {(["open", "in_progress", "resolved", "closed"] as const).map((s) => (
                <button
                  key={s}
                  disabled={saving || selectedTicket.status === s}
                  onClick={() => handleSave(s)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 border ${
                    selectedTicket.status === s
                      ? STATUS_STYLES[s]
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {saving && selectedTicket.status !== s ? <i className="fa-solid fa-circle-notch animate-spin" /> : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
