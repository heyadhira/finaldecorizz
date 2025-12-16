import React, { useEffect, useState, useContext } from "react";
import AdminSidebar from "./AdminSidebar";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";
import { Search, User } from "lucide-react";

export default function AdminUsers() {
  const { accessToken, isLoading } = useContext(AuthContext);

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isLoading || !accessToken) return;
    fetchUsers();
  }, [isLoading, accessToken]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/users`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />

      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">
          Manage Users
        </h1>

        {/* Search Bar */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 flex items-center gap-3 border border-gray-200">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-gray-800"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 border-b-2 border-gray-700 rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500 py-20">
            No users found.
          </p>
        ) : (
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-gray-700">User</th>
                  <th className="text-left py-3 text-gray-700">Email</th>
                  <th className="text-left py-3 text-gray-700">Created At</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-4 flex items-center gap-3 text-gray-900">
                      <div className="w-10 h-10 rounded-full bg-teal-100 text-[#14b8a6] flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      {user.name || "Unnamed User"}
                    </td>

                    <td className="py-4 text-gray-700">{user.email}</td>

                    <td className="py-4 text-gray-600">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
