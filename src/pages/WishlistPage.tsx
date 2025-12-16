import React, { useContext, useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { AuthContext } from '../context/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import SkeletonProductCard from '../components/SkeletonProductCard';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export default function WishlistPage() {
  const { user, accessToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  const fetchWishlist = async () => {
    try {
      if (!user) { setProducts([]); setLoading(false); return; }
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      const ids: string[] = data.wishlist?.items || [];
      const details = await Promise.all(ids.map(async (id) => {
        const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${id}`, { headers: { Authorization: `Bearer ${publicAnonKey}` } });
        const d = await r.json();
        return d.product;
      }));
      setProducts(details.filter(Boolean));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="soft-card p-8 sm:p-12 card-appear mb-6">
          <h1 className="text-center custom-heading">
            <span className="text-[#3b2f27]">Your</span> <span style={{ color: '#14b8a6' }}>Wishlist</span>
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (<SkeletonProductCard key={i} />))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <Link key={p.id} to={`/product/${p.id}`} className="group soft-card rounded-lg hover:shadow-lg transition overflow-hidden">
                <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#0b1220', borderBottom: '1px solid #334155' }}>
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" draggable={false} />
                </div>
                <div className="p-4">
                  <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>{p.category || 'Frame'}</p>
                  <h3 className="mb-1" style={{ color: '#e5e7eb' }}>{p.name}</h3>
                  <p className="font-semibold" style={{ color: '#e5e7eb' }}>₹ {Number(p.price).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">Your wishlist is empty.</p>
        )}
      </section>
      <Footer />
    </div>
  );
}
