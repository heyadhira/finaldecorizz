import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Heart } from 'lucide-react';
import { wishlistEvents } from '../utils/wishlistEvents';
import { AuthContext } from '../context/AuthContext';
import { cartEvents } from '../utils/cartEvents';
import logo from "../assets/logo-r.png";
import { TopMarquee } from "./TopMarquee";

// Images for Mega Menu
import img1 from "../assets/1.jpg";
import img2 from "../assets/2.jpg";
import img3 from "../assets/3.jpg";
import img5 from "../assets/5.jpg";
import batman from "../assets/batman.png";
import monkey from "../assets/monkey.png";
import canva from "../assets/canva.jpg";
import owl from "../assets/owl.jpg";
import hero from "../assets/hero.jpg";
import img4 from "../assets/4.jpg";


export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [showDecorDropdown, setShowDecorDropdown] = useState(false);
  const [showMobileDecorDropdown, setShowMobileDecorDropdown] = useState(false);
  const [showMobileProfileDropdown, setShowMobileProfileDropdown] = useState(false);
  const [showMobileFramesDropdown, setShowMobileFramesDropdown] = useState(false);
  const [showFramesDropdown, setShowFramesDropdown] = useState(false);
  const { user, logout, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [atTop, setAtTop] = useState(true);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const framesTimerRef = useRef<any>(null);
  const decorTimerRef = useRef<any>(null);

  const handleFramesEnter = () => {
    if (framesTimerRef.current) clearTimeout(framesTimerRef.current);
    setShowFramesDropdown(true);
  };

  const handleFramesLeave = () => {
    framesTimerRef.current = setTimeout(() => {
      setShowFramesDropdown(false);
    }, 150);
  };

  const handleDecorEnter = () => {
    if (decorTimerRef.current) clearTimeout(decorTimerRef.current);
    setShowDecorDropdown(true);
  };

  const handleDecorLeave = () => {
    decorTimerRef.current = setTimeout(() => {
      setShowDecorDropdown(false);
    }, 150);
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchCartCount();
      const unsubscribe = cartEvents.subscribe(() => {
        fetchCartCount();
      });
      fetchWishlistCount();
      const unWish = wishlistEvents.subscribe(() => fetchWishlistCount());
      const onFocus = () => fetchWishlistCount();
      window.addEventListener('visibilitychange', onFocus);
      return unsubscribe;
    }
  }, [user, accessToken]);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchCartCount = async () => {
    try {
      const response = await fetch(
        `https://wievhaxedotrhktkjupg.supabase.co/functions/v1/make-server-52d68140/cart`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      const count = data.cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      setCartCount(count);
    } catch (error) {
      console.error('Cart count error:', error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch(
        `https://wievhaxedotrhktkjupg.supabase.co/functions/v1/make-server-52d68140/wishlist`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await response.json();
      const count = (data.wishlist?.items?.length) || 0;
      setWishlistCount(count);
    } catch (error) {
      console.error('Wishlist count error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const transparent = !isMobile && atTop && location.pathname === '/';
  const isDarkTheme = typeof document !== 'undefined' && !!document.querySelector('.dark-theme');

  return (
    <>
      <TopMarquee />
      <nav className={`fixed top-8 left-0 right-0 z-50 ${transparent ? '' : 'shadow-sm'}`} style={{ backgroundColor: transparent ? (isDarkTheme ? '#0f172a' : '#ffffff') : (isDarkTheme ? '#0f172a' : '#ffffff'), borderBottom: transparent ? 'none' : (isDarkTheme ? '1px solid #334155' : '1px solid #e5e7eb') }}>


        <div className="w-full px-4 sm:px-6 xl:px-8">

          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div
              // className="w-10 h-10 rounded flex items-center justify-center"
              // style={{
              //   backgroundColor: '#14b8a6',
              //   color: 'white'
              // }}
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>

              <span
                className="text-xl"
                style={{
                  fontWeight: 700,
                  color: isDarkTheme ? '#e5e7eb' : '#1f2937'
                }}
              >
                DECORIZZ
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {[
                { to: '/', label: 'Home' },
                // { to: '/about', label: 'About us' },
                { to: '/gallery', label: 'Gallery' },
                { to: '/contact', label: 'Contact' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-full px-4 py-2 text-sm"
                  style={{
                    backgroundColor: isActive(item.to) ? (isDarkTheme ? '#111827' : 'white') : (isDarkTheme ? '#1f2937' : '#e9e5dc'),
                    boxShadow: isActive(item.to) ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <div
                className="relative"
                onMouseEnter={handleFramesEnter}
                onMouseLeave={handleFramesLeave}
              >
                <button
                  className="rounded-full px-4 py-2 text-sm transition hover:text-teal-600"
                  style={{
                    backgroundColor: isActive('/shop') ? (isDarkTheme ? '#111827' : 'white') : (isDarkTheme ? '#1f2937' : '#e9e5dc'),
                    boxShadow: isActive('/shop') ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                  }}
                >

                  <span className='text-white'>Frames
                    <svg className={`ml-1 inline-block w-4 h-4 transition-transform ${showFramesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {showFramesDropdown && (
                  <div
                    className="fixed left-0 right-0 top-24 bg-white/95 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-[999]"
                    onMouseEnter={handleFramesEnter}
                    onMouseLeave={handleFramesLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                          Shop by Category
                        </h3>
                        <Link
                          to="/shop"
                          className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 group"
                        >
                          View All Frames
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                        {[
                          { label: 'Home Decor', to: '/shop?category=Home Decor', img: img1 },
                          { label: 'Wall Art', to: '/shop?category=Wall Art', img: img2 },
                          { label: 'Bestselling', to: '/shop?category=Bestselling', img: img3 },
                          { label: 'Hot & Fresh', to: '/shop?category=Hot & Fresh', img: img5 },
                          { label: 'Gen Z', to: '/shop?category=Gen Z', img: batman },
                          { label: 'Graffiti Art', to: '/shop?category=Graffiti Art', img: monkey },
                          { label: 'Modern Art', to: '/shop?category=Modern Art', img: canva },
                          { label: 'Animal', to: '/shop?category=Animal', img: owl },
                        ].map((item) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
                            onClick={() => setShowFramesDropdown(false)}
                          >
                            <div className="relative w-full aspect-square overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <img
                                src={item.img}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link
                to="/shop-by-videos"
                className="rounded-full px-4 py-2 text-sm"
                style={{
                  backgroundColor: isActive('/shop-by-videos') ? (isDarkTheme ? '#111827' : 'white') : (isDarkTheme ? '#1f2937' : '#e9e5dc'),
                  boxShadow: isActive('/shop-by-videos') ? '0 0 0 2px #14b8a6' : 'none',
                  fontWeight: 600,
                }}
              >
                Shop by Videos
              </Link>

              {/* Decor by Room Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleDecorEnter}
                onMouseLeave={handleDecorLeave}
              >
                <button
                  className="rounded-full px-4 py-2 text-sm transition hover:text-teal-600"
                  style={{
                    backgroundColor: isActive('/decor-by-room') ? (isDarkTheme ? '#111827' : 'white') : (isDarkTheme ? '#1f2937' : '#e9e5dc'),
                    boxShadow: isActive('/decor-by-room') ? '0 0 0 2px #14b8a6' : 'none',
                    fontWeight: 600,
                  }}
                >
                  <span className={isActive('/decor-by-room') ? (isDarkTheme ? 'text-white' : 'text-gray-900') : (isDarkTheme ? 'text-gray-300' : 'text-gray-700')}>
                    Decor by Room
                    <svg className={`ml-1 inline-block w-4 h-4 transition-transform ${showDecorDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>


                {showDecorDropdown && (
                  <div
                    className="fixed left-0 right-0 top-24 bg-white/95 backdrop-blur-md shadow-xl border-t border-gray-100 animate-fadeIn z-[999]"
                    onMouseEnter={handleDecorEnter}
                    onMouseLeave={handleDecorLeave}
                  >
                    <div className="max-w-7xl mx-auto px-8 py-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                          Shop by Room
                        </h3>
                        <Link
                          to="/decor-by-room"
                          className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 group"
                        >
                          View All Rooms
                          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </Link>
                      </div>

                      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                        {[
                          { label: 'Living Area', to: '/decor-by-room?room=Living Area', img: img1 },
                          { label: 'Bedroom', to: '/decor-by-room?room=Bedroom', img: img2 },
                          { label: 'Kitchen', to: '/decor-by-room?room=Kitchen', img: img3 },
                          { label: 'Dining', to: '/decor-by-room?room=Dining Area', img: img5 },
                          { label: 'Office', to: '/decor-by-room?room=Office / Study Zone', img: canva },
                          { label: 'Kids', to: '/decor-by-room?room=Kids Space', img: hero },
                          { label: 'Bath', to: '/decor-by-room?room=Bath Space', img: img4 },
                        ].map((item) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            className="group flex flex-col items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
                            onClick={() => setShowDecorDropdown(false)}
                          >
                            <div className="relative w-full aspect-square overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition-all">
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10" />
                              <img
                                src={item.img}
                                alt={item.label}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                              />
                            </div>
                            <span className="font-semibold text-gray-700 group-hover:text-teal-600 text-center transition-colors">
                              {item.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative" style={{ zIndex: 50 }}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search frames..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-12 py-2 border rounded-lg focus:outline-none"
                  style={{
                    borderColor: isDarkTheme ? '#334155' : '#d1d5db',
                    backgroundColor: isDarkTheme ? '#0b1220' : '#ffffff',
                    color: isDarkTheme ? '#e5e7eb' : '#1f2937',
                    width: '240px',
                    fontSize: '14px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#14b8a6';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDarkTheme ? '#334155' : '#d1d5db';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <Search
                  className="absolute right-2 top-1/2 w-5 h-5 pointer-events-none"
                  style={{ transform: 'translateY(-50%)', color: isDarkTheme ? '#94a3b8' : '#6b7280' }}
                />
              </div>
            </form>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4 relative" style={{ zIndex: 50 }}>

              {/* Wishlist Icon */}
              <Link to="/wishlist" className="relative transition" style={{ color: isDarkTheme ? '#e5e7eb' : '#374151' }}>
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2 min-w-[1.25rem] h-5 px-1.5 text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white z-10 bg-[#14b8a6] text-black">
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative transition"
                style={{ color: isDarkTheme ? '#e5e7eb' : '#374151' }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2 min-w-[1.25rem] h-5 px-1.5  from-red-500 to-red-600 text-balck text-[10px] rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white z-10  bg-[#ff3d00]">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>

              {/* User/Login - Desktop Only */}
              {user ? (
                <div className="relative group hidden md:flex">
                  <button
                    className="inline-flex items-center gap-2  p-2 rounded-md transition"
                    style={{ color: isDarkTheme ? '#e5e7eb' : '#1f2937' }}
                  >
                    <User className="w-5 h-5" />
                    <span style={{ fontWeight: 500 }}>
                      {user.name}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className="absolute right-50px top-1/2 mt-2 w-48 rounded-lg shadow-lg py-2 hidden group-hover:block"
                    style={{ backgroundColor: isDarkTheme ? '#0f172a' : '#ffffff', border: isDarkTheme ? '1px solid #334155' : '1px solid #e5e7eb', zIndex: 100 }}
                  >
                    <Link
                      to="/account"
                      className="block px-4 py-2 transition"
                      style={{ fontWeight: 500, color: isDarkTheme ? '#cbd5e1' : '#374151' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkTheme ? '#1f2937' : '#f3f4f6';
                        e.currentTarget.style.color = '#14b8a6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = isDarkTheme ? '#cbd5e1' : '#374151';
                      }}
                    >
                      My Account
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 transition"
                        style={{ fontWeight: 500, color: isDarkTheme ? '#cbd5e1' : '#374151' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkTheme ? '#1f2937' : '#f3f4f6';
                          e.currentTarget.style.color = '#14b8a6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = isDarkTheme ? '#cbd5e1' : '#374151';
                        }}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 transition"
                      style={{ fontWeight: 500, color: isDarkTheme ? '#cbd5e1' : '#374151' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDarkTheme ? '#1f2937' : '#f3f4f6';
                        e.currentTarget.style.color = '#14b8a6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = isDarkTheme ? '#cbd5e1' : '#374151';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  aria-label="Login"
                  title="Login"
                  className="hidden md:flex items-center justify-center rounded-full px-6 py-2 transition"
                  style={{ backgroundColor: '#14b8a6', color: 'white', fontWeight: 700 }}
                >
                  Log In
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden"
                style={{ color: isDarkTheme ? '#e5e7eb' : '#374151' }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div
              className="lg:hidden py-4  px-6 space-y-3"
              style={{ borderTop: isDarkTheme ? '1px solid #334155' : '1px solid #e5e7eb', zIndex: 1000, backgroundColor: isDarkTheme ? '#0f172a' : '#ffffff', position: 'relative' }}
            >

              <Link
                to="/"
                className="block py-2 transition"
                style={{ fontWeight: 500, color: isDarkTheme ? '#e5e7eb' : '#374151' }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDarkTheme ? '#e5e7eb' : '#374151'}
              >
                Home
              </Link>
              {/* Frames - Mobile Collapsible */}
              <div className="py-2">
                <button
                  onClick={() => setShowMobileFramesDropdown(!showMobileFramesDropdown)}
                  className="w-full flex items-center justify-between transition hover:text-teal-600"
                  style={{ fontWeight: 500, color: isDarkTheme ? '#e5e7eb' : '#374151' }}
                >
                  <span
                    onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = isDarkTheme ? '#e5e7eb' : '#374151'}
                  >
                    Frames
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showMobileFramesDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMobileFramesDropdown && (
                  <div className="pl-4 space-y-2 mt-2">
                    <Link
                      to="/shop"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      All Frames
                    </Link>
                    {[
                      { label: 'Home Decor', to: '/shop?category=Home Decor' },
                      { label: 'Wall Art', to: '/shop?category=Wall Art' },
                      { label: 'Bestselling', to: '/shop?category=Bestselling' },
                      { label: 'Hot & Fresh', to: '/shop?category=Hot & Fresh' },
                      { label: 'Gen Z', to: '/shop?category=Gen Z' },
                      { label: 'Graffiti Art', to: '/shop?category=Graffiti Art' },
                      { label: 'Modern Art', to: '/shop?category=Modern Art' },
                      { label: 'Animal', to: '/shop?category=Animal' },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Decor by Room - Mobile Collapsible */}
              <div className="py-2">
                <button
                  onClick={() => setShowMobileDecorDropdown(!showMobileDecorDropdown)}
                  className="w-full flex items-center justify-between text-gray-700 font-semibold transition hover:text-teal-600"
                >
                  <span>Decor by Room</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showMobileDecorDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMobileDecorDropdown && (
                  <div className="pl-4 space-y-2 mt-2">
                    <Link
                      to="/decor-by-room"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      All Rooms
                    </Link>
                    <Link
                      to="/decor-by-room?room=Living Area"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Living Area
                    </Link>
                    <Link
                      to="/decor-by-room?room=Bedroom"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Bedroom
                    </Link>
                    <Link
                      to="/decor-by-room?room=Kitchen"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Kitchen
                    </Link>
                    <Link
                      to="/decor-by-room?room=Dining Area"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dining Area
                    </Link>
                    <Link
                      to="/decor-by-room?room=Office / Study Zone"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Office / Study Zone
                    </Link>
                    <Link
                      to="/decor-by-room?room=Kids Space"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Kids Space
                    </Link>
                    <Link
                      to="/decor-by-room?room=Bath Space"
                      className="block text-gray-600 py-1 text-sm transition hover:text-teal-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Bath Space
                    </Link>
                  </div>
                )}
              </div>

              {/* <Link
                to="/about"
                className="block text-gray-700 py-2 transition"
                style={{ fontWeight: 500 }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
              >
                About
              </Link> */}
              <Link
                to="/gallery"
                className="block text-gray-700 py-2 transition"
                style={{ fontWeight: 500 }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
              >
                Gallery
              </Link>
              <Link
                to="/shop-by-videos"
                className="block text-gray-700 py-2 transition"
                style={{ fontWeight: 500 }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
              >
                Shop by Videos
              </Link>

              <Link
                to="/contact"
                className="block text-gray-700 py-2 transition"
                style={{ fontWeight: 500 }}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
              >
                Contact
              </Link>

              {/* Profile Section - Mobile Collapsible */}
              {user ? (
                <div className="py-2 border-t border-gray-200 mt-2 pt-4">
                  <button
                    onClick={() => setShowMobileProfileDropdown(!showMobileProfileDropdown)}
                    className="w-full flex items-center justify-between text-gray-700 font-semibold transition hover:text-teal-600"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span>{user.name}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${showMobileProfileDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showMobileProfileDropdown && (
                    <div className="pl-4 space-y-2 mt-2">
                      <Link
                        to="/account"
                        className="block text-gray-600 py-2 text-sm transition hover:text-teal-600"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowMobileProfileDropdown(false);
                        }}
                      >
                        My Account
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block text-gray-600 py-2 text-sm transition hover:text-teal-600"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowMobileProfileDropdown(false);
                          }}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsMenuOpen(false);
                          setShowMobileProfileDropdown(false);
                        }}
                        className="block w-full text-left text-red-600 py-2 text-sm transition hover:text-red-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block text-gray-700 py-2 transition border-t border-gray-200 mt-2 pt-4"
                  style={{ fontWeight: 500 }}
                  onClick={() => setIsMenuOpen(false)}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
                >
                  Login
                </Link>
              )}

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="pt-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search frames..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-2 border rounded-lg focus:outline-none"
                    style={{
                      borderColor: '#d1d5db',
                      fontSize: '14px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#14b8a6';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <Search
                    className="absolute right-2 top-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                    style={{ transform: 'translateY(-50%)' }}
                  />
                </div>
              </form>
            </div>
          )}
        </div>

      </nav>
    </>
  );
}
