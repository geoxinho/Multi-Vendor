"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  storeName?: string;
  isBanned: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchUsers = () => {
    const url = filter ? `/api/admin/users?role=${filter}&limit=100` : "/api/admin/users?limit=100";
    fetch(url).then((r) => r.json()).then((d) => { setUsers(d.users ?? []); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, [filter]);

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

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A4860E]/30 focus:border-[#A4860E] w-52"
          />
          {["", "buyer", "seller", "admin"].map((r) => (
            <button key={r}
              onClick={() => { setLoading(true); setFilter(r); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === r ? "bg-[#A4860E] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#A4860E]"}`}>
              {r === "" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-32" size="lg" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Store / Brand", "Email", "Phone", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{user.name}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#A4860E]">
                    {user.storeName ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#fdf8e8] border border-[#e8d48a]">
                        <i className="fa-solid fa-store text-[10px]" />
                        {user.storeName}
                      </span>
                    ) : (
                      <span className="text-gray-300 font-normal">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{user.phone || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className={`badge cursor-pointer ${roleColor[user.role]} border-0 bg-opacity-80 text-xs font-semibold focus:outline-none`}
                    >
                      <option value="buyer">buyer</option>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${user.isBanned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {user.isBanned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBanToggle(user._id, user.isBanned)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${user.isBanned ? "border-green-200 text-green-600 hover:bg-green-50" : "border-red-200 text-red-500 hover:bg-red-50"}`}>
                        {user.isBanned ? "Unban" : "Ban"}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
