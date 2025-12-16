import React, { useEffect, useState, useContext } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { AuthContext } from '../../context/AuthContext';
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { toast } from "sonner";
import AdminSidebar from "./AdminSidebar";

export default function AdminTestimonials() {
  const { accessToken } = useContext(AuthContext);

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    text: "",
    rating: 5,
    profileImage: "",
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await res.json();
      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error("Fetch testimonials error:", err);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let profileUrl = formData.profileImage;
      if (profileFile) {
        const base64 = await fileToDataURL(profileFile);
        const resUp = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/profile/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ image: base64, fileName: profileFile.name }),
        });
        const dataUp = await resUp.json();
        if (!resUp.ok) throw new Error(dataUp.error || 'Profile upload failed');
        profileUrl = dataUp.url;
      }

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ ...formData, profileImage: profileUrl }),
        }
      );

      if (res.ok) {
        toast.success("Testimonial added");
        setShowForm(false);
        setFormData({ name: "", text: "", rating: 5, profileImage: "" });
        setProfileFile(null);
        setProfilePreview("");
        fetchTestimonials();
      } else {
        toast.error("Failed to add testimonial");
      }
    } catch (err) {
      console.error("Add testimonial error:", err);
      toast.error("Error adding testimonial");
    }
  };

  const fileToDataURL = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        toast.success("Testimonial deleted");
        fetchTestimonials();
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting testimonial");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />

      {/* Main Content */}
      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              Manage Testimonials
            </h1>
            <p className="text-gray-600">Add, view, and delete testimonials</p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-5 h-5" />
            Add Testimonial
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Add New Testimonial
            </h2>

            <form onSubmit={addTestimonial} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              {/* Text */}
              <div>
                <label className="block text-gray-700 mb-1">Testimonial</label>
                <textarea
                  required
                  rows={4}
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-gray-700 mb-1">Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: Number(e.target.value) })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {num} Stars
                    </option>
                  ))}
                </select>
              </div>

              {/* Profile Image */}
              <div>
                <label className="block text-gray-700 mb-1">Profile Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e)=>{
                  const f = e.target.files?.[0] || null;
                  setProfileFile(f);
                  setProfilePreview(f ? URL.createObjectURL(f) : "");
                }} className="w-full" />
                {profilePreview && (
                  <div className="mt-2">
                    <img src={profilePreview} alt="preview" className="w-16 h-16 rounded-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700"
                >
                  Add Testimonial
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* All Testimonials */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 border-b-2 border-gray-700 rounded-full animate-spin"></div>
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-gray-500 text-center py-16">
            No testimonials available.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-start gap-3 mb-3">
                  <img src={t.profileImage || ''} alt={t.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                  <div className="flex-1">
                    <input defaultValue={t.name} onBlur={async (e)=>{
                      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/${t.id}`, {
                        method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ name: e.target.value })
                      }); const d = await res.json(); if (!res.ok) return toast.error(d.error||'Update failed'); fetchTestimonials();
                    }} className="border rounded px-3 py-2 w-full" />
                    <textarea defaultValue={t.text} onBlur={async (e)=>{
                      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/${t.id}`, {
                        method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ text: e.target.value })
                      }); const d = await res.json(); if (!res.ok) return toast.error(d.error||'Update failed'); fetchTestimonials();
                    }} className="mt-2 border rounded px-3 py-2 w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Change Image</label>
                    <input type="file" accept="image/*" onChange={async (e)=>{
                      const f=e.target.files?.[0]; if(!f) return; const reader=new FileReader(); reader.onload=async ()=>{
                        const base64=reader.result as string; const up=await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/profile/upload`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body: JSON.stringify({ image: base64, fileName: f.name })}); const ud=await up.json(); if(!up.ok) return toast.error(ud.error||'Upload failed'); const res=await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/${t.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body: JSON.stringify({ profileImage: ud.url })}); const d=await res.json(); if(!res.ok) return toast.error(d.error||'Update failed'); fetchTestimonials(); };
                      reader.readAsDataURL(f);
                    }} className="text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-700">Rating</span>
                  <select defaultValue={t.rating} onChange={async (e)=>{
                    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/${t.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${accessToken}` }, body: JSON.stringify({ rating: Number(e.target.value) })}); const d=await res.json(); if(!res.ok) return toast.error(d.error||'Update failed'); fetchTestimonials();
                  }} className="border rounded px-2 py-1">
                    {[5,4,3,2,1].map(n=>(<option key={n} value={n}>{n} Stars</option>))}
                  </select>
                </div>

                <div className="flex mb-2">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <button onClick={() => deleteTestimonial(t.id)} className="mt-2 flex items-center gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
