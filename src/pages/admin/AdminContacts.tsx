import React, { useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";
import { toast } from "sonner";
import AdminSidebar from "./AdminSidebar";
import { Search, Filter, Trash2, Eye, Archive, CheckCircle2, RefreshCw } from "lucide-react";

export default function AdminContacts() {
  const { accessToken } = useContext(AuthContext);

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to fetch contacts");
      } else {
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error("Fetch contacts error:", e);
      toast.error("Network error fetching contacts");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let items = contacts;
    if (statusFilter !== "all") items = items.filter((c) => (c.status || "new") === statusFilter);
    if (q) items = items.filter((c) => [c.name, c.email, c.subject, c.message].some((v: string) => (v || "").toLowerCase().includes(q)));
    items = items.sort((a: any, b: any) => {
      const av = a[sortBy.key];
      const bv = b[sortBy.key];
      const cmp = new Date(av).getTime() - new Date(bv).getTime();
      return sortBy.dir === "asc" ? cmp : -cmp;
    });
    return items;
  }, [contacts, query, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const setSort = (key: string) => {
    setSortBy((prev) => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update");
      } else {
        toast.success("Updated");
        setContacts((prev) => prev.map((c) => (c.id === id ? data.contact : c)));
      }
    } catch (e) {
      toast.error("Network error updating status");
    }
  };

  const removeContact = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete");
      } else {
        toast.success("Deleted");
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      toast.error("Network error deleting contact");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />
      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Contact Messages</h1>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative">
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, email, subject" className="pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white w-full md:w-64" />
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button onClick={fetchContacts} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-12 w-12 border-b-2 border-gray-800 rounded-full animate-spin" /></div>
        ) : filtered.length > 0 ? (
          isDesktop ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => setSort("createdAt")}>Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paged.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-700">{new Date(c.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{c.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{c.phone || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{c.subject || "—"}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (c.status || "new") === "new" ? "bg-teal-100 text-teal-800" : (c.status || "new") === "read" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-800"
                          }`}>{c.status || "new"}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setSelected(c)} title="View"><Eye className="w-4 h-4" /></button>
                            <button className="p-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => updateStatus(c.id, "read")} title="Mark as read"><CheckCircle2 className="w-4 h-4" /></button>
                            <button className="p-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => updateStatus(c.id, "archived")} title="Archive"><Archive className="w-4 h-4" /></button>
                            <button className="p-2 rounded bg-red-100 hover:bg-red-200 text-red-700" onClick={() => removeContact(c.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-3 bg-gray-50">
                <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50">Prev</button>
                  <button disabled={page>=totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {paged.map((c) => (
                <div key={c.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</p>
                      <h3 className="text-base md:text-lg font-semibold text-gray-900">{c.name}</h3>
                      <p className="text-gray-700 text-xs md:text-sm break-all">{c.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (c.status || "new") === "new" ? "bg-teal-100 text-teal-800" : (c.status || "new") === "read" ? "bg-amber-100 text-amber-800" : "bg-gray-200 text-gray-800"
                    }`}>{c.status || "new"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-xs md:text-sm text-gray-900 break-all">{c.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Subject</p>
                      <p className="text-xs md:text-sm text-gray-900">{c.subject || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">Message</p>
                    <p className="text-xs md:text-sm text-gray-900">{(c.message || '').length > 140 ? `${c.message.slice(0,140)}…` : c.message}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 p-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => setSelected(c)} title="View"><Eye className="w-4 h-4" /></button>
                    <button className="flex-1 p-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => updateStatus(c.id, "read")} title="Mark as read"><CheckCircle2 className="w-4 h-4" /></button>
                    <button className="flex-1 p-2 rounded bg-gray-100 hover:bg-gray-200" onClick={() => updateStatus(c.id, "archived")} title="Archive"><Archive className="w-4 h-4" /></button>
                    <button className="flex-1 p-2 rounded bg-red-100 hover:bg-red-200 text-red-700" onClick={() => removeContact(c.id)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between px-2">
                <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <button disabled={page<=1} onClick={() => setPage((p)=>Math.max(1,p-1))} className="px-2 md:px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50">Prev</button>
                  <button disabled={page>=totalPages} onClick={() => setPage((p)=>Math.min(totalPages,p+1))} className="px-2 md:px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          )
        ) : (
          <p className="text-center py-12 text-gray-500 text-lg">No contact messages found</p>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
            <div className="bg-white rounded-xl shadow-xl w-[94vw] md:w-full md:max-w-2xl max-h-[80vh] overflow-y-auto p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{selected.name}</h2>
                  <p className="text-gray-600 text-xs md:text-sm">{new Date(selected.createdAt).toLocaleString()}</p>
                </div>
                <button className="px-3 py-2 rounded-lg border border-gray-300 bg-white" onClick={() => setSelected(null)}>Close</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Email</p>
                  <p className="text-gray-900 break-all">{selected.email}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Phone</p>
                  <p className="text-gray-900 break-all">{selected.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1 font-medium">Subject</p>
                  <p className="text-gray-900">{selected.subject || '—'}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-600 font-medium mb-2">Message</p>
                <p className="text-gray-900 whitespace-pre-wrap break-words">{selected.message}</p>
              </div>
              <div className="mt-6 flex items-center justify-end gap-2">
                <button className="px-3 py-2 rounded-lg border border-gray-300 bg-white" onClick={() => updateStatus(selected.id, 'read')}>Mark Read</button>
                <button className="px-3 py-2 rounded-lg border border-gray-300 bg-white" onClick={() => updateStatus(selected.id, 'archived')}>Archive</button>
                <button className="px-3 py-2 rounded-lg bg-red-600 text-white" onClick={() => { removeContact(selected.id); setSelected(null); }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
