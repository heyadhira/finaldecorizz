import React, { useContext, useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { AuthContext } from "../../context/AuthContext";
import { projectId } from "../../utils/supabase/info";
import { Link } from "react-router-dom";

export default function AdminInstagram() {
  const { accessToken } = useContext(AuthContext);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [items, setItems] = useState<Array<{ id: string; url: string; embedUrl: string }>>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram`);
      const data = await res.json();
      setItems(data.items || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setSubmitting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram`, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ url })
      });
      const d = await res.json();
      if (res.ok) { setUrl(""); fetchItems(); }
      else alert(d.error || 'Failed');
    } catch { alert('Network error'); }
    setSubmitting(false);
  };

  const removeItem = async (id: string) => {
    if (!confirm('Remove this post?')) return;
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) fetchItems(); else alert('Failed');
    } catch { alert('Network error'); }
  };

  return (
    <div className="min-h-screen content-offset flex">
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />
      <div className="w-full pt-16 p-4 md:p-10" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <h1 className="custom-heading mb-8">Instagram Posts</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={addItem} className="flex gap-3 items-center">
            <input type="url" placeholder="Paste Instagram post/reel URL" value={url} onChange={(e)=>setUrl(e.target.value)} className="flex-1 px-4 py-2 rounded-lg border focus:outline-none" style={{ borderColor:'#d1d5db' }} />
            <button type="submit" className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor:'#14b8a6' }} disabled={submitting}>{submitting ? 'Adding…' : 'Add'}</button>
            <Link to="/contact" className="premium-btn-white">View on Contact Page</Link>
          </form>
          <p className="text-sm text-gray-600 mt-2">Examples: https://www.instagram.com/p/POST_ID/ or https://www.instagram.com/reel/REEL_ID/</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="w-12 h-12 border-b-2 border-[var(--primary)] rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(it => (
              <div key={it.id} className="soft-card p-4 rounded-3xl shadow-xl border border-gray-200">
                <iframe src={it.embedUrl} width="100%" height="420" className="w-full rounded-2xl" style={{ border:'0', overflow:'hidden' }} loading="lazy" referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
                <div className="flex justify-between items-center mt-3">
                  <a href={it.url} target="_blank" rel="noreferrer" className="text-sm text-[#14b8a6]">Open post</a>
                  <button onClick={()=>removeItem(it.id)} className="px-3 py-1 rounded border">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

