"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchUsers = () => {
    const url = filter ? `/api/admin/users?role=${filter}` : "/api/admin/users";
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
    buyer: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-2">
          {["", "buyer", "seller", "admin"].map((r) => (
            <button key={r}
              onClick={() => { setLoading(true); setFilter(r); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === r ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-green-300"}`}>
              {r === "" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner className="py-32" size="lg" /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
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
                  <td className="px-4 py-3 text-gray-400 text-xs">
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
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
