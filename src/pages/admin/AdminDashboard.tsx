import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from '../../context/AuthContext';
import { projectId } from "../../utils/supabase/info";

import {
  Package,
  DollarSign,
  Users,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import AdminSidebar from "./AdminSidebar";

export default function AdminDashboard() {
  const { accessToken } = useContext(AuthContext);

  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingDeliveries: 0,
  });

  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/stats`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Stats fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupDbSelected = async (prefixes: string[], includeUsers = false) => {
    if (!prefixes || prefixes.length === 0) { alert('Select at least one table prefix'); return; }
    setCleaning(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/admin/cleanup`, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ prefixes, includeUsers })
      });
      const d = await res.json();
      setCleanResult(d);
      fetchStats();
    } catch (e) {
      setCleanResult({ error: 'Request failed' });
    } finally {
      setCleaning(false);
    }
  };

  const cleanupDb = async (includeUsers = false) => {
    if (!confirm(includeUsers ? 'This will wipe ALL data including users. Continue?' : 'This will wipe content data (products, orders, videos, etc.). Continue?')) return;
    setCleaning(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/admin/cleanup`, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ includeUsers })
      });
      const d = await res.json();
      setCleanResult(d);
      fetchStats();
    } catch (e) {
      setCleanResult({ error: 'Request failed' });
    } finally {
      setCleaning(false);
    }
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <Package className="w-7 h-7" />,
      bg: "bg-teal-100 text-[#14b8a6]",
    },
    {
      title: "Total Revenue",
      value: `₹ ${stats.totalRevenue.toFixed(2)}`,
      icon: <DollarSign className="w-7 h-7" />,
      bg: "bg-green-100 text-green-600",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="w-7 h-7" />,
      bg: "bg-purple-100 text-purple-600",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: <ShoppingBag className="w-7 h-7" />,
      bg: "bg-orange-100 text-orange-600",
    },
    {
      title: "Pending Deliveries",
      value: stats.pendingDeliveries,
      icon: <TrendingUp className="w-7 h-7" />,
      bg: "bg-red-100 text-red-600",
    },
  ];

  const quickLinks = [
    {
      title: "Manage Products",
      path: "/admin/products",
      description: "Add, edit, delete",
    },
    {
      title: "Manage Orders",
      path: "/admin/orders",
      description: "Track & update orders",
    },
    {
      title: "Manage Users",
      path: "/admin/users",
      description: "Registered customers",
    },
    {
      title: "Manage Gallery",
      path: "/admin/gallery",
      description: "Upload & manage images",
    },
    {
      title: "Manage Testimonials",
      path: "/admin/testimonials",
      description: "Client reviews",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb] flex">

      {/* SIDEBAR */}
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />

      {/* MAIN CONTENT */}
      <div className="w-full pt-24 p-4 md:p-10" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>

        {/* PAGE TITLE */}
        <h1 className="text-4xl font-bold text-gray-900 mb-10 tracking-tight pb-6">
          Admin Dashboard
        </h1>

        {/* LOADING SPINNER */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-b-2 border-[var(--primary)] rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* ============================ */}
            {/* STATS GRID */}
            {/* ============================ */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 mb-14">
  {statCards.map((stat, i) => (
    <div
      key={i}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
    >
      <div
        className={`${stat.bg} w-14 h-14 rounded-xl flex items-center justify-center mb-4`}
      >
        {stat.icon}
      </div>

      <p className="text-gray-600 text-sm">{stat.title}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
    </div>
  ))}
</div>

            {/* ============================ */}
            {/* QUICK ACTIONS */}
            {/* ============================ */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    to={link.path}
                    className="block p-6 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:shadow transition"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {link.description}
                    </p>
                  </Link>
                ))}
                <div className="p-6 rounded-lg border border-red-200 bg-red-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Cleanup</h3>
                  <p className="text-sm text-gray-600 mb-4">Select tables to wipe. Users retained unless explicitly selected.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {['product:','order:','cart:','wishlist:','testimonial:','gallery:','faq:','contact:','video:','video-like:','video-comment:','notification:','payment:','reset:','reset-email:','user:'].map((p) => (
                      <label key={p} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" value={p} className="w-4 h-4" style={{ accentColor: '#14b8a6' }} />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const checks = Array.from(document.querySelectorAll('input[type="checkbox"][value]')) as HTMLInputElement[];
                        const prefixes = checks.filter(c => c.checked).map(c => c.value);
                        const includeUsers = prefixes.includes('user:');
                        cleanupDbSelected(prefixes, includeUsers);
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                      disabled={cleaning}
                    >
                      {cleaning ? 'Cleaning…' : 'Clean Selected'}
                    </button>
                    <button onClick={() => cleanupDb(true)} className="px-4 py-2 rounded-lg border border-red-600 text-red-700 hover:bg-red-100" disabled={cleaning}>Clean All (incl. Users)</button>
                  </div>
                  {cleanResult && (
                    <pre className="mt-3 text-xs bg-white p-3 rounded border overflow-auto max-h-36">{JSON.stringify(cleanResult, null, 2)}</pre>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
