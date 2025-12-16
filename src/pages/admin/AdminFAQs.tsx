import React, { useContext, useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { AuthContext } from '../../context/AuthContext';
import { projectId } from '../../utils/supabase/info';
import { toast } from 'sonner';

export default function AdminFAQs() {
  const { accessToken } = useContext(AuthContext);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: '', answer: '', order: 0 });

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs`);
      const data = await res.json();
      setItems(data.faqs || []);
    } catch (e) {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const createFaq = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Create failed');
      toast.success('FAQ created');
      setForm({ question: '', answer: '', order: 0 });
      fetchFaqs();
    } catch { toast.error('Create failed'); }
  };

  const updateFaq = async (id: string, updates: any) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Update failed');
      toast.success('Updated');
      setItems(items.map(i => i.id === id ? data.faq : i));
    } catch { toast.error('Update failed'); }
  };

  const deleteFaq = async (id: string) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || 'Delete failed');
      toast.success('Deleted');
      setItems(items.filter(i => i.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />
      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">FAQs</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={form.question} onChange={e=>setForm({...form, question: e.target.value})} placeholder="Question" className="border rounded px-3 py-2" />
            <input value={form.answer} onChange={e=>setForm({...form, answer: e.target.value})} placeholder="Answer" className="border rounded px-3 py-2" />
            <input type="number" value={form.order} onChange={e=>setForm({...form, order: Number(e.target.value)})} placeholder="Order" className="border rounded px-3 py-2" />
          </div>
          <button onClick={createFaq} className="premium-btn mt-4 rounded-lg p-2">Create</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-12 w-12 border-b-2 border-gray-800 rounded-full animate-spin"/></div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input defaultValue={item.question} onBlur={(e)=>updateFaq(item.id, { question: e.target.value })} className="border rounded px-3 py-2" />
                  <input defaultValue={item.answer} onBlur={(e)=>updateFaq(item.id, { answer: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" />
                  <input type="number" defaultValue={item.order || 0} onBlur={(e)=>updateFaq(item.id, { order: Number(e.target.value) })} className="border rounded px-3 py-2" />
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={()=>deleteFaq(item.id)} className="px-3 py-2 rounded bg-red-600 text-white">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
