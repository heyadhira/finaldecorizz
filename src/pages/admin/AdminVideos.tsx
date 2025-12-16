import React, { useContext, useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { AuthContext } from '../../context/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

type VideoItem = { id: string; title: string; url: string; caption?: string; thumbnail?: string; order?: number };

export default function AdminVideos() {
  const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { accessToken } = useContext(AuthContext);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<VideoItem>({ id: '', title: '', url: '', caption: '', thumbnail: '', order: 0 });
  const [productId, setProductId] = useState('');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10 MB

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`);
      const data = await res.json();
      setItems(data.videos || []);
    } catch (e) { toast.error('Failed to load videos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, []);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });
  const isYouTube = (url: string) => /youtube\.com|youtu\.be/.test(url);
  const isGoogleDrive = (url: string) => /drive\.google\.com/.test(url);
  const normalizeUrl = (url: string) => {
    if (!url) return url;
    if (isYouTube(url)) return url.includes('watch?v=') ? url.replace('watch?v=', 'embed/') : url;
    if (isGoogleDrive(url)) {
      const fileMatch = url.match(/\/file\/d\/([^/]+)/);
      const idParam = url.match(/[?&]id=([^&]+)/);
      const id = fileMatch?.[1] || idParam?.[1];
      return id ? `https://drive.google.com/file/d/${id}/preview` : url;
    }
    return url;
  };

  const createVideo = async () => {
    try {
      let thumbUrl = form.thumbnail || '';
      if (thumbFile) {
        const base64 = await toBase64(thumbFile);
        const up = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/thumbnail/upload`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ image: base64, fileName: thumbFile.name })
        });
        const ud = await up.json();
        if (!up.ok) return toast.error(ud.error || 'Upload failed');
        thumbUrl = ud.url;
      }
      let videoUrl = form.url || '';
      if (videoFile) {
        if (videoFile.size > MAX_VIDEO_SIZE) {
          return toast.error('Video is too large. Max size is 10MB.');
        }
        setUploading(true);
        const toBase64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
        const base64 = await toBase64(videoFile);
        const up = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/upload`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ video: base64, fileName: videoFile.name, mimeType: videoFile.type })
        });
        const ud = await up.json();
        setUploading(false);
        if (!up.ok) return toast.error(ud.error || 'Upload failed');
        videoUrl = ud.url;
      }
      if (!videoUrl && form.url) {
        // Validate Google Drive links: must be a file link (contains /file/d/<id> or ?id=)
        if (isGoogleDrive(form.url)) {
          const fileMatch = form.url.match(/\/file\/d\/([^/]+)/);
          const idParam = form.url.match(/[?&]id=([^&]+)/);
          const id = fileMatch?.[1] || idParam?.[1];
          if (!id) {
            return toast.error('Paste a Google Drive FILE link (Open the file → Copy link), not a folder link');
          }
        }
        videoUrl = normalizeUrl(form.url);
      }
      if (!videoUrl) {
        return toast.error('Please upload a video file or paste a valid video URL');
      }
      let thumbFinal = thumbUrl;
      if (!thumbFinal && form.url) {
        const fileMatch = form.url.match(/\/file\/d\/([^/]+)/);
        const idParam = form.url.match(/[?&]id=([^&]+)/);
        const id = fileMatch?.[1] || idParam?.[1];
        if (id) thumbFinal = `https://drive.google.com/thumbnail?id=${id}&sz=w640`;
      }
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ ...form, url: videoUrl, thumbnail: thumbFinal, productId })
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Create failed');
      toast.success('Video added');
      setForm({ id:'', title:'', url:'', caption:'', thumbnail:'', order: 0 }); setThumbFile(null); setThumbPreview(''); setVideoFile(null); setVideoPreview(''); setProductId('');
      fetchVideos();
    } catch { toast.error('Create failed'); }
  };

  const updateVideo = async (id: string, updates: Partial<VideoItem>) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(updates)
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Update failed');
      toast.success('Updated');
      setItems(items.map(v => v.id === id ? d.video : v));
    } catch { toast.error('Update failed'); }
  };

  const deleteVideo = async (id: string) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Delete failed');
      toast.success('Deleted');
      setItems(items.filter(v => v.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar onSidebarWidthChange={(w)=>setSidebarWidth(w)} />
      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <h1 className="custom-heading mb-6"><span className="text-[#3b2f27]">Shop by</span> <span style={{ color: '#14b8a6' }}>Videos</span></h1>

        {/* Create */}
        <div className="soft-card rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add Video</h2>
          <div className="mb-3">
            <a href="https://drive.google.com/drive/folders/1H6JXi-VX7-uIIX1rplfbO0ffyZuo3Aub?usp=sharing" target="_blank" rel="noopener noreferrer" className="premium-btn-white px-6 py-2 rounded-lg">Open Google Drive Folder</a>
            <span className="ml-3 text-sm text-gray-600"><br /> <br />Paste file link below if you upload to Drive.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Title" className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
            <div>
              <label className="text-sm text-gray-600">Upload Video</label>
              <input type="file" accept="video/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setVideoFile(f); setVideoPreview(f?URL.createObjectURL(f):''); }} className="w-full b-2px solid black" />
              {videoPreview && <video src={videoPreview} controls className="mt-2 w-40 h-24 rounded" />}
              {uploading && (
                <div className="mt-2 flex items-center gap-2 text-gray-700">
                  <div className="h-5 w-5 border-b-2 border-gray-800 rounded-full animate-spin" />
                  <span className="text-sm">Uploading video…</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Max 10MB. For larger videos, upload to Google Drive and paste the link below.</p>
            </div>
            <input value={form.url} onChange={e=>setForm({...form, url:e.target.value})} placeholder="Or paste Video URL (YouTube / Google Drive / MP4)" className="border border-gray-300 rounded-lg px-6 py-2 bg-white" />
            <input value={form.caption} onChange={e=>setForm({...form, caption:e.target.value})} placeholder="Caption (optional)" className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
            <input type="number" value={form.order || 0} onChange={e=>setForm({...form, order: Number(e.target.value)})} placeholder="Order" className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
            <input value={productId} onChange={e=>setProductId(e.target.value)} placeholder="Related Product ID (optional)" className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
            <div>
              <label className="text-sm text-gray-600">Thumbnail</label>
              <input type="file" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]||null; setThumbFile(f); setThumbPreview(f?URL.createObjectURL(f):''); }} className="w-full" />
              {thumbPreview && <img src={thumbPreview} alt="thumb" className="mt-2 w-24 h-16 object-cover rounded" />}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={createVideo} className="premium-btn py-2 px-4 rounded-lg" disabled={uploading}>{uploading ? 'Uploading…' : 'Create'}</button>
            <button onClick={()=>{ setForm({ id:'', title:'', url:'', caption:'', thumbnail:'', order:0 }); setVideoFile(null); setVideoPreview(''); setThumbFile(null); setThumbPreview(''); }} className="premium-btn premium-btn py-2 px-4 rounded-lg">Clear</button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-12 w-12 border-b-2 border-gray-800 rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {items.map(v => (
              <div key={v.id} className="soft-card rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <div>
                    {v.thumbnail ? <img src={v.thumbnail} alt={v.title} className="w-32 h-20 object-cover rounded" /> : <div className="skeleton w-32 h-20 rounded" />}
                    <input type="file" accept="image/*" onChange={async (e)=>{ const f=e.target.files?.[0]; if(!f) return; const base64=await toBase64(f); const up=await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/thumbnail/upload`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body: JSON.stringify({ image: base64, fileName: f.name })}); const ud=await up.json(); if(!up.ok) return toast.error(ud.error||'Upload failed'); await updateVideo(v.id, { thumbnail: ud.url }); }} className="mt-2 text-sm" />
                  </div>
                  <input defaultValue={v.title} onBlur={(e)=>updateVideo(v.id, { title: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                  <input defaultValue={v.url} onBlur={(e)=>updateVideo(v.id, { url: normalizeUrl(e.target.value) })} className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                  <input defaultValue={String((v as any).productId||'')} onBlur={(e)=>updateVideo(v.id, { productId: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                  <input type="number" defaultValue={v.order || 0} onBlur={(e)=>updateVideo(v.id, { order: Number(e.target.value) })} className="border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                </div>
                <textarea defaultValue={v.caption || ''} onBlur={(e)=>updateVideo(v.id, { caption: e.target.value })} className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white" />
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={()=>deleteVideo(v.id)} className="premium-btn py-2 px-4 rounded-lg">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
