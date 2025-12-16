import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import SkeletonProductCard from '../components/SkeletonProductCard';
import { Filter, X, ChevronDown } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';


const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" }
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const isDarkTheme = typeof document !== 'undefined' && !!document.querySelector('.dark-theme');

  return (
    <div className="relative w-48">
      {/* Button */}
      <button
        className="border px-4 py-2 rounded-xl font-medium w-full flex items-center justify-between"
        style={{
          borderColor: isDarkTheme ? '#334155' : '#d1d5db',
          backgroundColor: isDarkTheme ? '#0f172a' : '#ffffff',
          color: isDarkTheme ? '#e5e7eb' : '#374151'
        }}
        onClick={() => setOpen(!open)}
      >
        {SORT_OPTIONS.find(o => o.value === value)?.label}
        <ChevronDown className={`w-4 h-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-12 w-full rounded-xl shadow-xl z-50 animate-fadeIn"
          style={{
            backgroundColor: isDarkTheme ? '#0f172a' : '#ffffff',
            border: `1px solid ${isDarkTheme ? '#334155' : '#e5e7eb'}`
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="w-full text-left px-6 py-3 text-sm rounded-lg transition"
              style={{ color: isDarkTheme ? '#e5e7eb' : '#374151' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



const ROOM_OPTIONS = [
  { name: 'Home Bar' },
  { name: 'Bath Space' },
  { name: 'Bedroom' },
  { name: 'Dining Area' },
  { name: 'Game Zone / Lounge Cave' },
  { name: 'Workshop / Garage Space' },
  { name: 'Fitness Room' },
  { name: 'Entryway / Corridor' },
  { name: 'Kids Space' },
  { name: 'Kitchen' },
  { name: 'Living Area' },
  { name: 'Office / Study Zone' },
  { name: 'Pooja Room' },
];


const LAYOUT_OPTIONS = ['Portrait', 'Square', 'Landscape'];
const SIZE_OPTIONS = ['8×12', '12×18', '18×24', '20×30', '24×36', '30×40', '36×48', '48×66', '18×18', '24×24', '36×36', '20×20', '30×30'];
const COLOR_OPTIONS = ['White', 'Black', 'Brown'];
const MATERIAL_OPTIONS = ['Wood', 'Metal', 'Plastic', 'Glass'];
// CATEGORY_OPTIONS now computed dynamically from products

// Simple Fisher–Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  room?: string;
  roomCategory?: string;
  layout?: string;
  size?: string;
  sizes?: string[];
  colors?: string[];
  material?: string;
  category?: string;
  createdAt?: string;
  subsection?: '2-Set' | '3-Set' | 'Square';
  format?: 'Rolled' | 'Canvas' | 'Frame';
  frameColor?: 'White' | 'Black' | 'Brown';
}

export default function ShopPage() {
  // ⬇️ Add this block RIGHT AFTER imports


  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const shuffledProducts = useMemo(() => shuffleArray(products), [products]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    if (showFilters) {
      body.style.overflow = 'hidden';
      body.style.touchAction = 'none';
    } else {
      body.style.overflow = '';
      body.style.touchAction = '';
    }
    return () => {
      body.style.overflow = '';
      body.style.touchAction = '';
    };
  }, [showFilters]);

  const [expandedSections, setExpandedSections] = useState({
    room: true,
    layout: true,
    size: true,
    colors: true,
    materials: true,
    categories: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = (typeof window !== 'undefined' && window.innerWidth < 640) ? 8 : 12;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState({
    rooms: [] as string[],
    layouts: [] as string[],
    sizes: [] as string[],
    colors: [] as string[],
    materials: [] as string[],
    categories: [] as string[],
    priceMin: 0,
    priceMax: 10000,
    sortBy: 'popular',
  });

  const [formatSubsection, setFormatSubsection] = useState<'All' | 'Rolled' | 'Canvas' | 'Frame'>('All');
  const [subsectionChip, setSubsectionChip] = useState<'All' | '2-Set' | '3-Set' | 'Square'>('All');

  const BASIC_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 679, Canvas: 800, Frame: 999 },
    '12X18': { Rolled: 879, Canvas: 1100, Frame: 1299 },
    '18X24': { Rolled: 1280, Canvas: 1699, Frame: 1799 },
    '20X30': { Rolled: 1780, Canvas: 2599, Frame: 2799 },
    '24X36': { Rolled: 1999, Canvas: 2999, Frame: 3299 },
    '30X40': { Rolled: 3580, Canvas: 4599, Frame: 5199 },
    '36X48': { Rolled: 3500, Canvas: 5799, Frame: 6499 },
    '48X66': { Rolled: 5879, Canvas: 9430, Frame: null },
    '18X18': { Rolled: 1199, Canvas: 1699, Frame: 1899 },
    '24X24': { Rolled: 1599, Canvas: 2299, Frame: 2499 },
    '36X36': { Rolled: 3199, Canvas: 4599, Frame: 4999 },
    '20X20': { Rolled: 1299, Canvas: 1899, Frame: 1999 },
    '30X30': { Rolled: 2199, Canvas: 3199, Frame: 3499 },
  };

  const TWOSET_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 1299, Canvas: 1599, Frame: 1999 },
    '12X18': { Rolled: 1899, Canvas: 2199, Frame: 2499 },
    '18X24': { Rolled: 2499, Canvas: 3399, Frame: 3599 },
    '20X30': { Rolled: 3799, Canvas: 5199, Frame: 5599 },
    '24X36': { Rolled: 3999, Canvas: 5999, Frame: 6599 },
    '30X40': { Rolled: 5799, Canvas: 9399, Frame: 10399 },
    '36X48': { Rolled: 6999, Canvas: 11599, Frame: 12999 },
    '48X66': { Rolled: 11799, Canvas: 18899, Frame: null },
  };

  const THREESET_PRICE: Record<string, { Rolled: number | null; Canvas: number | null; Frame: number | null }> = {
    '8X12': { Rolled: 2099, Canvas: 2499, Frame: 2999 },
    '12X18': { Rolled: 2699, Canvas: 3399, Frame: 3899 },
    '18X24': { Rolled: 3899, Canvas: 5099, Frame: 5399 },
    '20X30': { Rolled: 5399, Canvas: 7799, Frame: 8399 },
    '24X36': { Rolled: 6999, Canvas: 8899, Frame: 9599 },
    '30X40': { Rolled: 8699, Canvas: 14099, Frame: 15559 },
    '36X48': { Rolled: 10599, Canvas: 17399, Frame: 19499 },
    '48X66': { Rolled: 17699, Canvas: 28299, Frame: null },
  };

  const normalizeSize = (s?: string) => {
    if (!s) return '';
    const cleaned = s.replace(/\s+/g, '').toUpperCase().replace('×', 'X');
    const parts = cleaned.split('X');
    if (parts.length !== 2) return cleaned;
    return `${parts[0]}X${parts[1]}`;
  };

  const computePriceFor = (
    size: string,
    format: 'Rolled' | 'Canvas' | 'Frame',
    subsection?: '2-Set' | '3-Set' | 'Square'
  ) => {
    const key = normalizeSize(size);
    const table = subsection === '2-Set' ? TWOSET_PRICE : subsection === '3-Set' ? THREESET_PRICE : BASIC_PRICE;
    const row = table[key];
    if (!row) return undefined;
    const value = row[format];
    return value === null ? undefined : value ?? undefined;
  };

  useEffect(() => {
    fetchProducts();
    const category = searchParams.get('category');
    if (category) {
      setFilters(prev => ({ ...prev, categories: [category] }));
    }
  }, [searchParams]);


  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomCounts = () => {
    const counts: { [key: string]: number } = {};
    products.forEach(p => {
      const room = p.roomCategory || p.room;
      if (room) {
        counts[room] = (counts[room] || 0) + 1;
      }
    });
    return counts;
  };

  const roomCounts = useMemo(() => getRoomCounts(), [products]);

  const getCategoryCounts = () => {
    const counts: { [key: string]: number } = {};
    products.forEach(p => {
      const cat = p.category || '';
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  };
  const categoryCounts = useMemo(() => getCategoryCounts(), [products]);
  const categoryNames = Object.keys(categoryCounts).sort();



  const toggleFilter = (filterType: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[filterType as keyof typeof prev] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
  };

  const clearFilters = () => {
    setFilters({
      rooms: [],
      layouts: [],
      sizes: [],
      colors: [],
      materials: [],
      categories: [],
      priceMin: 0,
      priceMax: 10000,
      sortBy: 'popular',
    });
  };

  const activeFilterCount =
    filters.rooms.length +
    filters.layouts.length +
    filters.sizes.length +
    filters.colors.length +
    filters.materials.length +
    filters.categories.length;



  const filteredProducts = useMemo(() => {
    // 🔹 Start from shuffled list instead of original
    let result = [...shuffledProducts];

    if (filters.rooms.length > 0) {
      result = result.filter(p => filters.rooms.includes(p.roomCategory || p.room || ''));
    }

    if (filters.layouts.length > 0) {
      result = result.filter(p => filters.layouts.includes(p.layout || ''));
    }

    if (filters.sizes.length > 0) {
      result = result.filter(p => {
        if (Array.isArray(p.sizes)) return p.sizes.some(s => filters.sizes.includes(s));
        return filters.sizes.includes(p.size || '');
      });
    }

    if (filters.colors.length > 0) {
      result = result.filter(p => p.colors?.some(c => filters.colors.includes(c)));
    }

    if (filters.materials.length > 0) {
      result = result.filter(p => filters.materials.includes(p.material || ''));
    }

    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category || ''));
    }

    result = result.filter(p => p.price >= filters.priceMin && p.price <= filters.priceMax);

    switch (filters.sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt || '').getTime() -
            new Date(a.createdAt || '').getTime()
        );
        break;
      // 'popular' → keep shuffled order
    }

    return result;
  }, [shuffledProducts, filters]);




  const finalFilteredProducts = useMemo(() => {
    return filteredProducts.filter(p => {
      const matchFormat =
        formatSubsection === "All" ? true : p.format === formatSubsection;

      const matchSubsection =
        subsectionChip === "All" ? true : p.subsection === subsectionChip;

      return matchFormat && matchSubsection;
    });
  }, [filteredProducts, formatSubsection, subsectionChip]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(finalFilteredProducts.length / PAGE_SIZE));
  }, [finalFilteredProducts]);

  const paginatedProducts = useMemo(() => {
    return finalFilteredProducts.slice(0, currentPage * PAGE_SIZE);
  }, [finalFilteredProducts, currentPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        setCurrentPage((p) => {
          const next = p + 1;
          const maxPages = Math.max(1, Math.ceil(finalFilteredProducts.length / PAGE_SIZE));
          return next <= maxPages ? next : p;
        });
      }
    }, { root: null, rootMargin: '200px', threshold: 0.01 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [finalFilteredProducts.length, PAGE_SIZE]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, formatSubsection, subsectionChip]);


  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        {/* HERO HEADER */}
        <section className=" mx-auto sm:px-6 mb-12">
          <div className="max-w-7xl mx-auto">
            <div className="soft-card p-8 sm:p-12 card-appear">
              <h1 className="text-center custom-heading">
                Shop <span style={{ color: "#14b8a6" }}>All Frames</span>
              </h1>
              <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#cbd5e1" }}>
                Curated frames to elevate every room with style and functionality.
              </p>
            </div>
          </div>
        </section>

        <div className="flex gap-8 items-start">
          {/* Filters Sidebar */}
          <div
            className={`${showFilters ? 'block' : 'hidden'
              } lg:block lg:static lg:w-64 lg:flex-shrink-0 lg:order-2 lg:z-auto`}
          >
            {/* Mobile Overlay */}
            <div
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowFilters(false)}
            ></div>

            {/* Filter Panel */}
            <div className="lg:w-64 rounded-3xl shadow-2xl lg:shadow-sm fixed lg:static left-0 right-0 top-0 bottom-0 lg:inset-auto overflow-y-auto lg:max-h-[calc(100vh-8rem)] flex flex-col touch-pan-y mobile-filter-panel z-40"
              style={{ overscrollBehavior: 'contain', backgroundColor: '#0f172a', border: '1px solid #334155', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#334155' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg lg:hidden">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: '#e5e7eb' }}>
                    Filters
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden p-2 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>


              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">

                {/* Category Filter */}
                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#334155' }}>
                  <button
                    onClick={() => toggleSection('categories')}
                    className="flex items-center justify-between w-full mb-3 transition"
                    style={{ fontWeight: 700, color: '#e5e7eb' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#e5e7eb'}
                  >
                    <h3>Categories</h3>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedSections.categories ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedSections.categories && (
                    <div className="space-y-2">
                      {categoryNames.map(name => (
                        <label key={name} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(name)}
                              onChange={() => toggleFilter('categories', name)}
                              className="mr-2"
                              style={{ accentColor: '#14b8a6' }}
                            />
                            <span className="text-sm transition" style={{ color: '#cbd5e1' }}>
                              {name}
                            </span>
                          </div>
                          <span className="text-xs" style={{ color: '#94a3b8' }}>({categoryCounts[name] || 0})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Layout Filter */}
                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                  <button
                    onClick={() => toggleSection('layout')}
                    className="flex items-center justify-between w-full mb-3 transition"
                    style={{ fontWeight: 700, color: '#1f2937' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'bg-teal'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                  >
                    <h3>Layout</h3>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedSections.layout ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedSections.layout && (
                    <div className="flex flex-wrap gap-2">
                      {LAYOUT_OPTIONS.map(layout => (
                        <button
                          key={layout}
                          onClick={() => toggleFilter('layouts', layout)}
                          className="px-4 py-2 rounded-lg border-2 text-sm transition-all transform active:scale-95"
                          style={{
                            backgroundColor: filters.layouts.includes(layout) ? '#14b8a6' : 'white',
                            color: filters.layouts.includes(layout) ? 'white' : '#374151',
                            borderColor: filters.layouts.includes(layout) ? '#14b8a6' : '#d1d5db',
                            fontWeight: 600
                          }}
                        >
                          {layout}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Room Filter */}
                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#334155' }}>
                  <button
                    onClick={() => toggleSection('room')}
                    className="flex items-center justify-between w-full mb-3 transition"
                    style={{ fontWeight: 700, color: '#e5e7eb' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#e5e7eb'}
                  >
                    <h3>Decor by Room</h3>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedSections.room ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedSections.room && (
                    <div className="space-y-2">
                      {ROOM_OPTIONS.map(room => {
                        const count = roomCounts[room.name] || 0;
                        return (
                          <label key={room.name} className="flex items-center cursor-pointer group py-2 px-3 rounded-lg transition">
                            <input
                              type="checkbox"
                              checked={filters.rooms.includes(room.name)}
                              onChange={() => toggleFilter('rooms', room.name)}
                              className="mr-3 w-5 h-5"
                              style={{ accentColor: '#14b8a6' }}
                            />
                            <span className="text-sm transition flex-1" style={{ color: '#cbd5e1' }}>
                              {room.name}
                            </span>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: '#94a3b8', backgroundColor: '#0b1220', border: '1px solid #334155' }}>
                              {count}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>


                {/* Size Filter */}
                {/* <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                <button
                  onClick={() => toggleSection('size')}
                  className="flex items-center justify-between w-full mb-3 transition"
                  style={{ fontWeight: 700, color: '#1f2937' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                >
                  <h3>Sizes</h3>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${expandedSections.size ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedSections.size && (
                  <div className="flex flex-wrap gap-2">
                    {SIZE_OPTIONS.map(size => (
                      <button
                        key={size}
                        onClick={() => toggleFilter('sizes', size)}
                        className="px-4 py-2 rounded-xl border-2 text-sm transition-all transform active:scale-95"
                        style={{
                          backgroundColor: filters.sizes.includes(size) ? '#14b8a6' : 'white',
                          color: filters.sizes.includes(size) ? 'white' : '#374151',
                          borderColor: filters.sizes.includes(size) ? '#14b8a6' : '#d1d5db',
                          fontWeight: 600
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div> */}

                {/* Color Filter */}
                {/* <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                <button
                  onClick={() => toggleSection('colors')}
                  className="flex items-center justify-between w-full mb-3 transition"
                  style={{ fontWeight: 700, color: '#1f2937' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                >
                  <h3>Color</h3>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${expandedSections.colors ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedSections.colors && (
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        onClick={() => toggleFilter('colors', color)}
                        className="px-3 py-1 rounded-full border text-sm transition"
                        style={{
                          backgroundColor: filters.colors.includes(color) ? '#14b8a6' : 'white',
                          color: filters.colors.includes(color) ? 'white' : '#374151',
                          borderColor: filters.colors.includes(color) ? '#14b8a6' : '#d1d5db',
                          fontWeight: 500
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                )}
              </div> */}

                {/* Material Filter */}
                {/* <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                <button
                  onClick={() => toggleSection('materials')}
                  className="flex items-center justify-between w-full mb-3 transition"
                  style={{ fontWeight: 700, color: '#1f2937' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
                >
                  <h3>Material</h3>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${expandedSections.materials ? 'rotate-180' : ''}`}
                  />
                </button>
                {expandedSections.materials && (
                  <div className="space-y-2">
                    {MATERIAL_OPTIONS.map(material => (
                      <label key={material} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={filters.materials.includes(material)}
                          onChange={() => toggleFilter('materials', material)}
                          className="mr-2"
                          style={{ accentColor: '#14b8a6' }}
                        />
                        <span className="text-gray-700 text-sm group-hover:text-teal-600 transition">
                          {material}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div> */}



                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="mb-3" style={{ fontWeight: 700, color: '#e5e7eb' }}>
                    Price Range
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters(prev => ({ ...prev, priceMax: Number(e.target.value) }))
                      }
                      className="w-full"
                      style={{ accentColor: '#14b8a6' }}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: '#cbd5e1' }}>₹{filters.priceMin}</span>
                      <span style={{ color: '#cbd5e1' }}>₹{filters.priceMax}</span>
                    </div>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-3 rounded-lg transition font-semibold"
                    style={{ backgroundColor: '#111827', color: '#e5e7eb', border: '1px solid #334155' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1f2937';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#111827';
                    }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Mobile Action Buttons */}
              <div className="lg:hidden p-4 border-t flex gap-3 sticky bottom-0" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 rounded-lg font-semibold transition"
                  style={{ border: '2px solid #334155', color: '#e5e7eb', backgroundColor: 'transparent' }}
                >
                  Clear
                </button>

                <button
                  onClick={() => setShowFilters(false)}
                  className="premium-btn-white flex-1"
                >
                  Show {filteredProducts.length} Products
                </button>

              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 w-full lg:order-1 min-w-0">
            {/* Sort */}
            <div className="flex items-center justify-between mb-6 
                max-sm:flex-col max-sm:items-start max-sm:gap-3">

              <p style={{ fontWeight: 500, color: '#cbd5e1' }}>
                <span style={{ color: '#14b8a6', fontWeight: 700 }}>
                  {filteredProducts.length}
                </span>
                {" "}products found
              </p>

              <SortDropdown
                value={filters.sortBy}
                onChange={(val) => setFilters(prev => ({ ...prev, sortBy: val }))}
              />

              {/* Mobile Filter Trigger (top) */}
              <button
                onClick={() => setShowFilters(true)}
                className="md:hidden p-2 rounded-lg border ml-3 flex items-center gap-2"
                style={{ borderColor: '#334155', backgroundColor: '#0f172a', color: '#e5e7eb' }}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>
            </div>
            {/* Subsection Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['All', '2-Set', '3-Set', 'Square'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setSubsectionChip(opt)}
                  className="px-4 py-2 rounded-full border text-sm transition"
                  style={{
                    backgroundColor: subsectionChip === opt ? '#14b8a6' : 'white',
                    color: subsectionChip === opt ? 'white' : '#374151',
                    borderColor: subsectionChip === opt ? '#14b8a6' : '#d1d5db',
                    fontWeight: 600,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Format Chips */}
            <div className="flex flex-wrap gap-3 mb-6">
              {(['All', 'Rolled', 'Canvas', 'Frame'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setFormatSubsection(opt)}
                  className="px-4 py-2 rounded-full border text-sm transition"
                  style={{
                    backgroundColor: formatSubsection === opt ? '#14b8a6' : 'white',
                    color: formatSubsection === opt ? 'white' : '#374151',
                    borderColor: formatSubsection === opt ? '#14b8a6' : '#d1d5db',
                    fontWeight: 600,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonProductCard key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>

                <div className="w-full overflow-hidden pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 w-full items-stretch">
                    {paginatedProducts.map(product => {
                      const chosenSize = filters.sizes[0] || "";
                      const effectiveSub =
                        subsectionChip === "All" ? product.subsection || "Basic" : subsectionChip;

                      const overridePrice =
                        formatSubsection !== "All" && chosenSize
                          ? computePriceFor(
                            chosenSize,
                            formatSubsection,
                            effectiveSub
                          )
                          : undefined;

                      return (
                        <div key={product.id} className="w-full h-full">
                          <ProductCard
                            product={product}
                            overridePrice={overridePrice}
                            eyeNavigates
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} style={{ height: '1px' }} />

              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products match your filters</p>
                <button
                  onClick={clearFilters}
                  className="premium-btn-white"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowFilters(true)}
        className="fixed bottom-6 right-4 md:hidden rounded-full border w-12 h-12 flex items-center justify-center shadow-lg z-50"
        style={{ borderColor: '#334155', backgroundColor: '#0f172a', color: '#e5e7eb' }}
      >
        <span className="sr-only">Filters</span>
        <Filter className="w-5 h-5" />
      </button>

      <Footer />
    </div>
  );
}
