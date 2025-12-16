import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Toaster } from 'sonner';


// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import UserAccountPage from './pages/UserAccountPage';
import GalleryPage from './pages/GalleryPage';
import AboutPage from './pages/AboutPage';
import TestimonialsPage from './pages/TestimonialsPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminSignupPage from './pages/AdminSignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminGallery from './pages/admin/AdminGallery';
import AdminPayments from './pages/admin/AdminPayments';
import AdminDelivery from './pages/admin/AdminDelivery';
import AdminContacts from './pages/admin/AdminContacts';
import AdminFAQs from './pages/admin/AdminFAQs';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundsPage from './pages/RefundsPage';
import WishlistPage from './pages/WishlistPage';
import ShopByVideosPage from './pages/ShopByVideosPage';
import AdminVideos from './pages/admin/AdminVideos';
import AdminInstagram from './pages/admin/AdminInstagram';
import DecorByRoomPage from './pages/DecorByRoomPage';
import ContactUsPage from './pages/ContactUsPage';
import { WhatsappButton } from './components/WhatsappButton';
import { CookieConsent } from './components/CookieConsent';
import { AuthContext, AuthContextType, User } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();



const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Auth context moved to ./context/AuthContext to keep this file exporting only components

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setAccessToken(session.access_token);
        fetchUser(session.access_token);
      } else {
        setAccessToken(null);
        setUser(null);
      }
      setIsLoading(false);
    });
    // also check current session once on mount
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (session?.access_token) {
          setAccessToken(session.access_token);
          fetchUser(session.access_token);
        }
      })
      .finally(() => setIsLoading(false));
    return () => { sub.subscription?.unsubscribe(); };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session?.access_token) {
        setAccessToken(session.access_token);
        await fetchUser(session.access_token);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.session) {
      setAccessToken(data.session.access_token);
      await fetchUser(data.session.access_token);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/auth/signup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    // Auto login after signup
    await login(email, password);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccessToken(null);
  };

  const googleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login',
        },
      });
    } catch (e: any) {
      console.error('Google auth error:', e);
      alert('Google sign-in is not enabled. Enable Google in Supabase Auth → Providers and add redirect URL.');
    }
  };

  const authValue: AuthContextType = {
    user,
    accessToken,
    login,
    signup,
    logout,
    googleLogin,
    isLoading,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:category/:name" element={<ProductDetailPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            {/* Protect checkout: redirect unauthenticated users to login with a return path */}
            <Route
              path="/checkout"
              element={user ? <CheckoutPage /> : <Navigate to="/login" state={{ redirect: '/checkout' }} replace />}
            />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/account" element={<UserAccountPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/refunds" element={<RefundsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/shop-by-videos" element={<ShopByVideosPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/decor-by-room" element={<DecorByRoomPage />} />
            <Route path="/contact" element={<ContactUsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin-signup" element={<AdminSignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />


            {/* Admin Routes */}
            <Route
              path="/admin"
              element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/products"
              element={user?.role === 'admin' ? <AdminProducts /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/orders"
              element={user?.role === 'admin' ? <AdminOrders /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/users"
              element={user?.role === 'admin' ? <AdminUsers /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/testimonials"
              element={user?.role === 'admin' ? <AdminTestimonials /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/gallery"
              element={user?.role === 'admin' ? <AdminGallery /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/payments"
              element={user?.role === 'admin' ? <AdminPayments /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/delivery"
              element={user?.role === 'admin' ? <AdminDelivery /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/contacts"
              element={user?.role === 'admin' ? <AdminContacts /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/faqs"
              element={user?.role === 'admin' ? <AdminFAQs /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/videos"
              element={user?.role === 'admin' ? <AdminVideos /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/instagram"
              element={user?.role === 'admin' ? <AdminInstagram /> : <Navigate to="/login" />}
            />
          </Routes>
          <WhatsappButton />
        </BrowserRouter>
        <Toaster position="top-right" />
        <CookieConsent />
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
