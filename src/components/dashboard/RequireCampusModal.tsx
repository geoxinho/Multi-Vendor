"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface School {
  _id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
}

export default function RequireCampusModal() {
  const { data: session, status, update } = useSession();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const needsSchool =
    status === "authenticated" &&
    session?.user &&
    session.user.role !== "admin" &&
    (!session.user.school || session.user.school.trim() === "");

  useEffect(() => {
    if (needsSchool) {
      setLoading(true);
      fetch("/api/schools")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSchools(data);
            setSelectedSchool(data[0].name);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [needsSchool]);

  if (!needsSchool) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) {
      setError("Please select your campus");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/user/set-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school: selectedSchool }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to set campus. Please try again.");
        setSaving(false);
        return;
      }

      // Update NextAuth JWT & active session
      await update({ school: selectedSchool });
      setSaving(false);
    } catch (err) {
      console.error("Failed to save campus:", err);
      setError("An unexpected error occurred. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-gray-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#fdf8e8] border border-[#e8d48a] flex items-center justify-center mx-auto mb-5 text-[#A4860E] text-2xl shadow-xs">
          <i className="fa-solid fa-graduation-cap" />
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Select Your Campus
          </h2>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            CampusGo scopes orders, listings, and campus deliveries to your university.
            Please select your campus to complete your one-time profile setup.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              University / Polytechnic Campus
            </label>
            <div className="relative">
              {loading ? (
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-400">
                  Loading campuses...
                </div>
              ) : (
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:border-[#A4860E] rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A4860E]/20 transition appearance-none pr-10"
                >
                  {schools.length === 0 ? (
                    <>
                      <option value="Adeleke University">Adeleke University</option>
                      <option value="Federal Polytechnic Ede">Federal Polytechnic Ede</option>
                    </>
                  ) : (
                    schools.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name} {s.code ? `(${s.code})` : ""}
                      </option>
                    ))
                  )}
                </select>
              )}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                <i className="fa-solid fa-chevron-down" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || loading || !selectedSchool}
            className="w-full py-3.5 px-4 bg-[#A4860E] hover:bg-[#8a7009] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Campus...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-check" />
                <span>Save Campus &amp; Continue</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
