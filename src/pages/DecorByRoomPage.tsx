import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Filter, X, ChevronDown } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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

export default function DecorByRoomPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ room: true });
  const [filters, setFilters] = useState({
    rooms: [] as string[],
    priceMin: 0,
    priceMax: 10000,
    sortBy: 'popular',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const room = searchParams.get('room');
    if (room) setFilters(prev => ({ ...prev, rooms: [room] }));
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Fetch error:', error);
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

  const roomCounts = getRoomCounts();
  const activeFilterCount = filters.rooms.length;

  const applyFilters = () => {
    let result = [...products];

    if (filters.rooms.length > 0) {
      result = result.filter(p => filters.rooms.includes(p.roomCategory || p.room || ''));
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
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        break;
    }

    setFilteredProducts(result);
  };

  useEffect(() => {
    applyFilters();
  }, [products, filters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
  };

  const toggleFilter = (key: 'rooms', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v: string) => v !== value)
        : [...prev[key], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ rooms: [], priceMin: 0, priceMax: 10000, sortBy: 'popular' });
  };

  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Same as Shop Page */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl lg:text-4xl" style={{ fontWeight: 700, color: '#1f2937' }}>
            Decor by Room
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 bg-gradient-to-r from-teal-500 to-blue-500 text-black px-6 py-3 rounded-xl shadow-lg hover:from-teal-600 hover:to-blue-600 transition-all active:scale-95"
          >
            <Filter className="w-5 h-5" />
            <span className="font-semibold">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-white text-teal-600 text-xs px-2 py-0.5 rounded-full font-bold">{activeFilterCount}</span>
            )}
          </button>
        </div>
        {showFilters && (
          <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
            <div className="absolute left-0 top-0 bottom-0 w-5/6 max-w-sm bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-teal-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg">
                    <Filter className="w-5 h-5 text-balck" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-semibold">{activeFilterCount}</span>
                  )}
                </div>
                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-white/50 rounded-full transition">
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                  <button onClick={() => toggleSection('room')} className="flex items-center justify-between w-full mb-3 transition" style={{ fontWeight: 700, color: '#1f2937' }}>
                    <h3>Decor by Room</h3>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.room ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSections.room && (
                    <div className="space-y-2">
                      {ROOM_OPTIONS.map(room => {
                        const count = roomCounts[room.name] || 0;
                        return (
                          <label key={room.name} className="flex items-center cursor-pointer group py-2 px-3 rounded-lg hover:bg-teal-50 transition">
                            <input type="checkbox" checked={filters.rooms.includes(room.name)} onChange={() => toggleFilter('rooms', room.name)} className="mr-3 w-5 h-5" style={{ accentColor: '#14b8a6' }} />
                            <span className="text-gray-700 text-sm group-hover:text-teal-600 transition flex-1">{room.name}</span>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{count}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                  <h3 className="mb-3" style={{ fontWeight: 700, color: '#1f2937' }}>
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
                      <span className="text-gray-500">₹{filters.priceMin}</span>
                      <span className="text-gray-500">₹{filters.priceMax}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={clearFilters} className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">Clear</button>
                  <button onClick={() => setShowFilters(false)} className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-black font-semibold hover:bg-gray-50 transition">Show {filteredProducts.length} Products</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">

          {/* Sidebar Filters - Same as Shop Page */}
          {/* Sidebar Filters - Same as Shop Page */}
          <div className="hidden md:block md:w-64 bg-white rounded-lg shadow-sm p-6 sticky top-24 h-fit self-start">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl" style={{ fontWeight: 700, color: '#1f2937' }}>
                Filters
              </h2>
            </div>

            <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <button
                onClick={() => toggleSection('room')}
                className="flex items-center justify-between w-full mb-3 transition"
                style={{ fontWeight: 700, color: '#1f2937' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#14b8a6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#1f2937'}
              >
                <h3>Decor by Room</h3>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.room ? 'rotate-180' : ''}`} />
              </button>
              {expandedSections.room && (
                <div className="space-y-2">
                  {ROOM_OPTIONS.map(room => {
                    const count = roomCounts[room.name] || 0;
                    return (
                      <label key={room.name} className="flex items-center cursor-pointer group py-2 px-3 rounded-lg hover:bg-teal-50 transition">
                        <input
                          type="checkbox"
                          checked={filters.rooms.includes(room.name)}
                          onChange={() => toggleFilter('rooms', room.name)}
                          className="mr-3 w-5 h-5"
                          style={{ accentColor: '#14b8a6' }}
                        />
                        <span className="text-gray-700 text-sm group-hover:text-teal-600 transition flex-1">
                          {room.name}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Range */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="mb-3" style={{ fontWeight: 700, color: '#1f2937' }}>
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
                  <span className="text-gray-500">₹{filters.priceMin}</span>
                  <span className="text-gray-500">₹{filters.priceMax}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={clearFilters} className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">Clear</button>
              <button onClick={() => setShowFilters(false)} className="flex-1 py-3 border-2  border-gray-300 rounded-lg bg-teal-600 text-black font-semibold hover:bg-teal-700 transition">Show {filteredProducts.length} Products</button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600" style={{ fontWeight: 500 }}>
                <span style={{ color: '#14b8a6', fontWeight: 700 }}>{filteredProducts.length}</span> products found
              </p>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="border rounded-lg px-4 py-2 focus:outline-none transition"
                style={{ borderColor: '#d1d5db', fontWeight: 500 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-12 w-12 border-b-2 rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No products found in this category</p>
              </div>
            ) : (

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                {filteredProducts.map((product) => (
                  <div className="h-full">
                    <ProductCard key={product.id} product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
