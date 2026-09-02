"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface School {
  _id: string;
  name: string;
  slug: string;
  code?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchSchools = () => {
    fetch("/api/schools?all=true")
      .then((r) => r.json())
      .then((d) => {
        setSchools(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          city: city.trim(),
          state: state.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add school");
      } else {
        setSuccess(`"${data.name}" added successfully!`);
        setName("");
        setCode("");
        setCity("");
        setState("");
        fetchSchools();
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (school: School) => {
    try {
      const res = await fetch(`/api/schools/${school._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !school.isActive }),
      });
      if (res.ok) fetchSchools();
    } catch {
      alert("Failed to update school status");
    }
  };

  const handleDelete = async (id: string, schoolName: string) => {
    if (!confirm(`Are you sure you want to delete "${schoolName}"?`)) return;
    try {
      const res = await fetch(`/api/schools/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSchools();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete school");
      }
    } catch {
      alert("Failed to delete school");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
          <i className="fa-solid fa-graduation-cap text-[#A4860E]" />
          Campuses &amp; Schools
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage affiliated universities, polytechnics, and campuses available for student buyers &amp; sellers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Add School Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs h-fit">
          <h2 className="font-bold text-gray-900 text-base mb-1">Add New Campus</h2>
          <p className="text-xs text-gray-500 mb-4">Add a new university or polytechnic to the marketplace</p>

          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2">
              <i className="fa-solid fa-circle-check shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Institution Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Obafemi Awolowo University"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 focus:border-[#A4860E] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Abbreviation / Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. OAU"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 focus:border-[#A4860E] transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  City / Town
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Ile-Ife"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 focus:border-[#A4860E] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Osun"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 focus:border-[#A4860E] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 bg-[#A4860E] text-white font-bold rounded-xl hover:bg-[#8a7009] transition-colors text-sm disabled:opacity-60 shadow-sm flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin text-xs" />
                  Adding Campus…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus text-xs" />
                  Add Campus
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Schools Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base">Active Campuses ({schools.length})</h2>
              <span className="text-xs text-gray-400">Available across platform</span>
            </div>

            {loading ? (
              <LoadingSpinner className="py-16" />
            ) : schools.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <i className="fa-solid fa-graduation-cap text-4xl mb-2 block text-gray-300" />
                No schools found. Add one on the left.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {schools.map((s) => (
                  <div key={s._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#fdf8e8] border border-[#e8d48a] flex items-center justify-center text-[#A4860E] shrink-0 font-bold text-xs">
                        {s.code || s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{s.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          {s.code && <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded text-[10px] text-gray-600 font-bold">{s.code}</span>}
                          {s.city && <span>{s.city}{s.state ? `, ${s.state}` : ""}</span>}
                          <span>&bull;</span>
                          <span className="font-mono text-[10px]">{s.slug}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                          s.isActive
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        {s.isActive ? "Active" : "Disabled"}
                      </button>
                      <button
                        onClick={() => handleDelete(s._id, s.name)}
                        className="text-xs p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete School"
                      >
                        <i className="fa-solid fa-trash-can text-sm" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
