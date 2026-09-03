"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UserAvatar from "@/components/shared/UserAvatar";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  storeName?: string;
  school?: string;
  passport?: string;
  avatar?: string;
  isBanned: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityStats {
  total: number;
  active: number;
  inactive7d: number;
  inactive30d: number;
  inactive90d: number;
}

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<{ _id: string; name: string; code?: string }[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  const initialRole = searchParams.get("role") || "";
  const initialActivity = searchParams.get("activity") || "";

  const [filter, setFilter] = useState(initialRole);
  const [activityFilter, setActivityFilter] = useState(initialActivity);
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const fetchUsers = () => {
    const params = new URLSearchParams({ limit: "150" });
    if (filter) params.set("role", filter);
    if (activityFilter) params.set("activity", activityFilter);
    if (schoolFilter && schoolFilter !== "all") params.set("school", schoolFilter);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        if (d.activityStats) setActivityStats(d.activityStats);
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
    setLoading(true);
    fetchUsers();
  }, [filter, activityFilter, schoolFilter]);

  const handleRoleChange = async (id: string, role: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  };

  const handleBanToggle = async (id: string, isBanned: boolean) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned: !isBanned }),
    });
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user permanently?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const roleColor: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    seller: "bg-blue-100 text-blue-700",
    buyer: "bg-emerald-100 text-emerald-700",
  };

  const getActivityBadge = (user: User) => {
    const now = Date.now();
    const effectiveTime = user.lastActiveAt
      ? new Date(user.lastActiveAt).getTime()
      : user.updatedAt
      ? new Date(user.updatedAt).getTime()
      : new Date(user.createdAt).getTime();

    const diffDays = Math.floor((now - effectiveTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {diffDays === 0 ? "Active today" : `Active ${diffDays}d ago`}
        </span>
      );
    }
    if (diffDays < 30) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
          <i className="fa-solid fa-clock text-[9px]" />
          Inactive {diffDays}d
        </span>
      );
    }
    if (diffDays < 90) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <i className="fa-solid fa-calendar-xmark text-[9px]" />
          Inactive {Math.floor(diffDays / 30)}mo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        <i className="fa-solid fa-user-slash text-[9px]" />
        Inactive &gt;90d
      </span>
    );
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.school?.toLowerCase().includes(search.toLowerCase()) ||
      u.storeName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track user engagement, roles, campus affiliation, and ban status.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] bg-white font-medium text-gray-700 shadow-2xs"
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
            placeholder="Search name, email, school…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] w-64 bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* Activity Filter Tabs */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-400 self-center uppercase tracking-wider mr-1">Activity:</span>
        {[
          { id: "", label: "All Activity", count: activityStats?.total },
          { id: "active", label: "Active (<7d)", count: activityStats?.active },
          { id: "inactive_7d", label: "Inactive 7–30d", count: activityStats?.inactive7d },
          { id: "inactive_30d", label: "Inactive 30–90d", count: activityStats?.inactive30d },
          { id: "inactive_90d", label: "Inactive >90d", count: activityStats?.inactive90d },
        ].map((tab) => {
          const isActive = activityFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setLoading(true);
                setActivityFilter(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#A4860E] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-white text-gray-700"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-gray-400 self-center uppercase tracking-wider mr-1">Role:</span>
        {["", "buyer", "seller", "admin"].map((r) => (
          <button
            key={r}
            onClick={() => {
              setLoading(true);
              setFilter(r);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === r
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {r === "" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-32" size="lg" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Name", "Store / Campus", "Email & Phone", "Role", "Activity Status", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          name={user.name}
                          passport={user.passport}
                          image={user.avatar}
                          role={user.role}
                          size="sm"
                          rounded="full"
                        />
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {user.storeName ? (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#fdf8e8] border border-[#e8d48a] font-semibold text-[#A4860E]">
                            <i className="fa-solid fa-store text-[10px]" />
                            {user.storeName}
                          </span>
                        </div>
                      ) : null}
                      {user.school ? (
                        <span className="text-gray-500 flex items-center gap-1 text-[11px]">
                          <i className="fa-solid fa-graduation-cap text-[#A4860E] text-[10px]" />
                          {user.school}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="text-gray-900">{user.email}</p>
                      <p className="text-gray-400 text-[11px]">{user.phone || "No phone"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`badge cursor-pointer ${roleColor[user.role]} border-0 text-xs font-bold focus:outline-none`}
                      >
                        <option value="buyer">buyer</option>
                        <option value="seller">seller</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getActivityBadge(user)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${user.isBanned ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}`}>
                        {user.isBanned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString("en-NG", { dateStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBanToggle(user._id, user.isBanned)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold transition-colors ${
                            user.isBanned
                              ? "border-green-200 text-green-600 hover:bg-green-50"
                              : "border-red-200 text-red-500 hover:bg-red-50"
                          }`}
                        >
                          {user.isBanned ? "Unban" : "Ban"}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-gray-400">
                      <i className="fa-solid fa-users text-4xl mb-3 text-gray-300 block" />
                      No users match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-32" size="lg" />}>
      <AdminUsersContent />
    </Suspense>
  );
}

