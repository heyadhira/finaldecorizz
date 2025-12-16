import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Trash2, Minus, Plus } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { AuthContext } from '../context/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { cartEvents } from '../utils/cartEvents';

export default function CartPage() {
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);

  const [cart, setCart] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Unauthenticated: show empty cart UI, don't redirect
      setLoading(false);
      setCart({ items: [] });
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const cartRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const cartData = await cartRes.json();
      setCart(cartData.cart);

      const productsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      const productsData = await productsRes.json();
      setProducts(productsData.products || []);

    } catch (error) {
      console.error("Fetch cart error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;

    const currentItem = cart.items.find((i: any) => i.productId === productId);

    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            productId,
            quantity: newQty - currentItem.quantity,
            size: currentItem.size,
            color: currentItem.color,
            format: currentItem.format,
            frameColor: currentItem.frameColor,
            price: currentItem.price,
            subsection: currentItem.subsection,
          })
        }
      );

      setCart({
        ...cart,
        items: cart.items.map((i: any) =>
          i.productId === productId ? { ...i, quantity: newQty } : i
        )
      });

    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart/${productId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        toast.success("Removed from cart");
      }

    } catch {
      toast.error("Failed to remove item");
    }
  };

  const getTotal = () => {
    if (!cart?.items) return 0;

    return cart.items.reduce((sum: number, item: any) => {
      const price = item.price ?? (products.find(p => p.id === item.productId)?.price || 0);
      return sum + price * item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen dark-theme content-offset">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2" style={{ borderColor: "#14b8a6" }}></div>
        </div>
        <Footer />
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />

      {/* Decorative Squares */}
      <div className="flex justify-between max-w-7xl mx-auto px-4 pt-10">
        <div className="flex gap-2">
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: "#334155" }}></div>
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: "#334155" }}></div>
        </div>

        <div className="flex gap-2">
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: "#334155" }}></div>
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: "#334155" }}></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="soft-card p-8 sm:p-12 card-appear mb-6">
            <h1 className="text-center custom-heading">
              Your <span style={{ color: "#14b8a6" }}>Cart</span>
            </h1>
          
          </div>

        {isEmpty ? (
          <div className="text-center py-24">
            <p className="text-xl mb-6" style={{ color: '#cbd5e1' }}>Your cart is empty</p>

            <button
              onClick={() => navigate('/shop')}
              className="px-10 py-3 rounded-xl text-white shadow-xl transition"
              style={{ backgroundColor: "#14b8a6" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#0d9488"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#14b8a6"}
            >
              Continue Shopping
            </button>
          </div>
        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ---------------- LEFT SIDE — CART ITEMS ---------------- */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item: any) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;

                return (
                  <div
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="rounded-lg p-4 shadow-sm border hover:shadow-lg transition"
                    style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  >
                    <div className="flex gap-4">

                      {/* Image - keep same size */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#0b1220', border: '1px solid #334155' }}>
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1" style={{ color: '#e5e7eb' }}>{product.name}</h3>
                        <p className="mb-1" style={{ color: '#cbd5e1' }}>
                          {item.color} • {item.size}
                        </p>
                        <p className="text-lg font-semibold" style={{ color: '#e5e7eb' }}>
                          ₹{(item.price ?? product.price).toFixed(2)}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex flex-col items-end justify-between">

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>

                        <div
                          className="flex items-center gap-2 border rounded-lg"
                          style={{ borderColor: '#334155' }}
                        >
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-2"
                          >
                            <Minus className="w-4 h-4" color="#94a3b8" />
                          </button>

                          <span className="px-3 font-medium" style={{ color: '#e5e7eb' }}>{item.quantity}</span>

                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-2"
                          >
                            <Plus className="w-4 h-4" color="#94a3b8" />
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* ---------------- RIGHT SIDE — ORDER SUMMARY ---------------- */}
            <div className="lg:col-span-1">
              <div
                className="rounded-lg p-6 shadow-sm border sticky top-24"
                style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#e5e7eb' }}>Order Summary</h2>

                <div className="space-y-3 mb-6" style={{ color: '#cbd5e1' }}>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span style={{ color: '#e5e7eb' }}>₹{getTotal().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span style={{ color: '#e5e7eb' }}>{getTotal() > 1000 ? "Free" : "₹99"}</span>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: '#334155' }}>
                    <div className="flex justify-between text-xl font-semibold" style={{ color: '#e5e7eb' }}>
                      <span>Total</span>
                      <span>
                        ₹{(getTotal() + (getTotal() > 1000 ? 0 : 99)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login', { state: { redirect: '/checkout' } });
                    } else {
                      navigate('/checkout');
                    }
                  }}
                  className="w-full px-6 py-3 rounded-xl premium-btn shadow-xl mb-3 transition"
                  style={{ backgroundColor: '#14b8a6', color: '#e5e7eb', fontWeight: 600 }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0d9488'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14b8a6'}
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate('/shop')}
                  className="w-full border rounded-xl px-6 py-3 transition"
                  style={{ borderColor: '#334155', color: '#e5e7eb', backgroundColor: 'transparent' }}
                >
                  Continue Shopping
                </button>

              </div>
            </div>

          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
