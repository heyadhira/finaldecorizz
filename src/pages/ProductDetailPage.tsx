import React, { useEffect, useState, useContext, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingCart, Check, Truck, Package, Lock, CheckSquare, CircleHelp, RotateCcw, FileText, ChevronDown, CheckCircle, Star, Share2, Copy, Home, ChevronRight, ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { AuthContext } from '../context/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { cartEvents } from '../utils/cartEvents';
import { optimizeImage } from "../utils/optimizeImage";
import { useInView } from "react-intersection-observer";
import LazyShow from "../components/LazyShow";
import watermark from "../assets/watermark.png";
import Scratched from "../assets/s.png";
import Black from "../assets/black.png";
import White from "../assets/white.png";
import Brown from "../assets/brown.png";
import CardBoard from "../assets/cardboard.png";
import Frame from "../assets/frm.png";
import Bubble from "../assets/bubble.png";



export default function ProductDetailPage() {
  const { id, category: categoryParam, name: nameParam } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useContext(AuthContext);

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'Rolled' | 'Canvas' | 'Frame'>('Rolled');
  const [selectedFrameColor, setSelectedFrameColor] = useState<'White' | 'Black' | 'Brown'>('Black');
  const [quantity, setQuantity] = useState(1);
  const [defaultColor, setDefaultColor] = useState('');
  const [defaultSize, setDefaultSize] = useState('');
  const [defaultFormat, setDefaultFormat] = useState<'Rolled' | 'Canvas' | 'Frame'>('Rolled');
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState<string>('50% 50%');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [thumbLimit, setThumbLimit] = useState(6);


  const imageContainerRef = useRef(null);
  const thumbStripRef = useRef<HTMLDivElement | null>(null);
  const touchXRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const nearestTimeoutRef = useRef<number | null>(null);
  const scrollThumbs = (dir: 'left' | 'right') => {
    const el = thumbStripRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    const itemWidth = firstChild?.offsetWidth ?? 80;
    const gap = parseFloat(getComputedStyle(el).gap || '12') || 12;
    const step = itemWidth + gap;
    const perPage = Math.max(1, Math.floor(el.clientWidth / step));
    const pageAmount = perPage * step - gap;
    el.scrollBy({ left: dir === 'right' ? pageAmount : -pageAmount, behavior: 'smooth' });
  };
  const handleThumbWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = thumbStripRef.current;
    if (!el) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: 'smooth' });
    }
  };
  const updateThumbScrollState = () => {
    const el = thumbStripRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    if (hasOverflow) {
      setCanScrollLeft(left > 2);
      setCanScrollRight(left < maxScroll - 2);
    } else {
      const idx = selectedIndex;
      setCanScrollLeft(idx > 0);
      setCanScrollRight(idx < Math.max(0, thumbItems.length - 1));
    }
  };
  const handleThumbTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchXRef.current = e.touches[0]?.clientX ?? null;
  };
  const handleThumbTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = thumbStripRef.current;
    if (!el) return;
    const prev = touchXRef.current;
    const cur = e.touches[0]?.clientX ?? null;
    if (prev != null && cur != null) {
      const dx = prev - cur;
      el.scrollBy({ left: dx, behavior: 'instant' as ScrollBehavior });
      touchXRef.current = cur;
    }
  };
  const handleThumbTouchEnd = () => {
    touchXRef.current = null;
  };
  const handleThumbClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = thumbStripRef.current;
    if (!el) return;
    const target = (e.target as HTMLElement).closest('.thumb-item') as HTMLElement | null;
    if (!target || !el.contains(target)) return;
    const idx = Array.prototype.indexOf.call(el.children, target);
    const child = el.children[idx] as HTMLElement | undefined;
    if (child) {
      const centerLeft = child.offsetLeft - el.clientWidth / 2 + child.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, centerLeft), behavior: 'smooth' });
    }
  };
  const handleThumbKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleArrow('right');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleArrow('left');
    }
  };

  useEffect(() => {
    const el = thumbStripRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'smooth' });
    updateThumbScrollState();
  }, [selectedFormat, selectedColor]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setThumbLimit(mq.matches ? 3 : 6);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const el = thumbStripRef.current;
    updateThumbScrollState();
    if (!el) return;
    const onScroll = () => {
      updateThumbScrollState();
      if (nearestTimeoutRef.current) {
        window.clearTimeout(nearestTimeoutRef.current);
        nearestTimeoutRef.current = null;
      }
      nearestTimeoutRef.current = window.setTimeout(() => {
        selectNearestFromScroll();
      }, 80);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [thumbStripRef.current]);

  const thumbItems = useMemo(() => {
    const items: Array<{ src: string; alt: string; onClick: () => void; selected: boolean; label?: string }> = [];
    if (!product) return items;
    items.push({
      src: product.image,
      alt: product?.name || 'Product',
      onClick: () => setSelectedImage(product.image),
      selected: selectedImage === product.image,
    });
    if (selectedFormat === 'Frame' && product.imagesByColor) {
      Object.entries(product.imagesByColor as Record<string, string>).forEach(([color, url]) => {
        if (url) {
          items.push({
            src: url,
            alt: color,
            onClick: () => {
              setSelectedImage(url);
              setSelectedColor(color);
            },
            selected: selectedImage === url,
          });
        }
      });
    }
    if (product.extraImages?.length) {
      product.extraImages.forEach((img: string, index: number) => {
        items.push({
          src: img,
          alt: `Product image ${index + 1}`,
          onClick: () => setSelectedImage(img),
          selected: selectedImage === img,
        });
      });
    }
    items.push({
      src: Scratched,
      alt: 'Frame Body',
      onClick: () => setSelectedImage(Scratched),
      selected: selectedImage === Scratched,
      // label: 'Frame Body',
    });
    const materialLabel =
      selectedFormat === 'Canvas'
        ? 'Canvas Material'
        : selectedFormat === 'Rolled'
          ? 'Rolled Material'
          : 'Frame Material';
    [White, Black, Brown, Frame, CardBoard, Bubble].forEach((src, i) => {
      items.push({
        src,
        alt: materialLabel,
        onClick: () => setSelectedImage(src),
        selected: selectedImage === src,
        // label: materialLabel,
      });
    });
    return items;
  }, [product, selectedImage, selectedFormat, selectedColor]);

  const limitedThumbs = useMemo(() => thumbItems.slice(0, thumbLimit), [thumbItems, thumbLimit]);
  const selectedIndex = useMemo(() => {
    const idx = thumbItems.findIndex((i) => i.selected);
    return idx >= 0 ? idx : 0;
  }, [thumbItems]);
  const selectNearestFromScroll = () => {
    const el = thumbStripRef.current;
    if (!el || !thumbItems.length) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    const item = thumbItems[nearestIdx];
    if (item && !item.selected) item.onClick();
  };
  const selectByIndex = (idx: number) => {
    if (!thumbItems.length) return;
    const clamped = Math.max(0, Math.min(idx, thumbItems.length - 1));
    const item = thumbItems[clamped];
    if (item) {
      item.onClick();
      const el = thumbStripRef.current;
      const child = el?.children?.[clamped] as HTMLElement | undefined;
      if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };
  const handleArrow = (dir: 'left' | 'right') => {
    const nextIdx = dir === 'left' ? selectedIndex - 1 : selectedIndex + 1;
    selectByIndex(nextIdx);
    updateThumbScrollState();
  };
  useEffect(() => {
    updateThumbScrollState();
  }, [selectedIndex, thumbItems.length]);

  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(2.5, z + 0.1)); // zoom in
      } else {
        setZoom((z) => Math.max(0.9, z - 0.1)); // zoom out (10% min)
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const updateOriginFromPoint = (clientX: number, clientY: number) => {
    const el = imageContainerRef.current as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    setOrigin(`${xPct}% ${yPct}%`);
  };


  useEffect(() => {
    fetchProduct();
  }, [id, categoryParam, nameParam]);

  useEffect(() => {
    const handler = () => {
      document.querySelectorAll(".protect-image").forEach(el => {
        el.classList.add("screenshot");
        setTimeout(() => el.classList.remove("screenshot"), 1500);
      });
    };

    window.addEventListener("keyup", (e) => {
      if (e.key === "PrintScreen") handler();
    });

    return () => window.removeEventListener("keyup", () => { });
  }, []);


  useEffect(() => {
    if (!product) return;

    if (selectedFormat === 'Frame') {
      const srcByColor = product.imagesByColor?.[selectedColor];
      const targetImage = srcByColor || (
        selectedColor === 'Black' ? Black :
          selectedColor === 'White' ? White :
            selectedColor === 'Brown' ? Brown : null
      );

      if (targetImage && selectedImage !== targetImage) {
        setSelectedImage(targetImage);
      }
    }
  }, [selectedFormat, selectedColor, product]);


  const fetchRelatedProducts = async (category: string, currentId?: string) => {
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
      const related = data.products
        .filter((p: any) => p.category === category && p.id !== (currentId || id))
        .slice(0, 4);
      setRelatedProducts(related);
    } catch (error) {
      console.error('Fetch related products error:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      let p;

      if (id) {
        // Fetch by ID
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${id}`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        p = data.product;
      } else if (nameParam) {
        // Fetch list and find by slug
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        const data = await response.json();
        const all = data.products || [];

        p = all.find((item: any) => {
          const itemSlug = (item.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return itemSlug === nameParam;
        });
      }

      if (p) {
        const data = { product: p }; // Mimic old structure for consistency if needed, or just use p

        if (data.product) {
          const p = data.product;

          const autoSize = p.sizes?.includes("8X12") ? "8X12" : p.sizes?.[0] || "";
          const autoColor = p.colors?.[0] || "";
          const autoFormat = p.format || "Rolled";

          setProduct({
            ...p,
            selectedColor: autoColor,
            defaultColor: autoColor,
            selectedSize: autoSize,
            defaultSize: autoSize,
            selectedFormat: autoFormat,
            defaultFormat: autoFormat,
            selectedFrameColor: p.frameColor || "Black",
          });

          // Update states too
          setSelectedSize(autoSize);
          setSelectedColor(autoColor);
          setSelectedFormat(autoFormat);



          fetchRelatedProducts(p.category, p.id);
        }
      }
    } catch (error) {
      console.error('Fetch product error:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeSize = (s?: string) => {
    if (!s) return '';
    const cleaned = s.replace(/\s+/g, '').toUpperCase().replace('×', 'X');
    const parts = cleaned.split('X');
    if (parts.length !== 2) return cleaned;
    return `${parts[0]}X${parts[1]}`;
  };

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

  const computePriceFor = (
    size: string,
    format: 'Rolled' | 'Canvas' | 'Frame',
    subsection?: 'Basic' | '2-Set' | '3-Set' | 'Square'
  ) => {
    const key = normalizeSize(size);
    const table = subsection === '2-Set' ? TWOSET_PRICE : subsection === '3-Set' ? THREESET_PRICE : BASIC_PRICE;
    const row = table[key];
    if (!row) return undefined;
    const value = row[format];
    return value === null ? undefined : value ?? undefined;
  };



  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add to cart');
      return;
    }

    if (!selectedSize) {
      toast.error('Please select size');
      return;
    }
    if (selectedFormat === 'Frame' && !selectedColor) {
      toast.error('Please select color');
      return;
    }

    try {
      const overridePrice = computePriceFor(selectedSize, selectedFormat, product.subsection) ?? product.price;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: id,
            quantity,
            size: selectedSize,
            color: selectedFormat === 'Frame' ? selectedColor : undefined,
            format: selectedFormat,
            frameColor: selectedFormat === 'Frame' ? selectedColor : undefined,
            price: overridePrice,
            subsection: product.subsection,
          }),
        }
      );

      if (response.ok) {
        toast.success('Added to cart');
        cartEvents.emit();
      } else {
        toast.error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to buy');
      return;
    }

    if (!selectedSize) {
      toast.error('Please select size');
      return;
    }
    if (selectedFormat === 'Frame' && !selectedColor) {
      toast.error('Please select color');
      return;
    }

    try {
      const overridePrice = computePriceFor(selectedSize, selectedFormat, product.subsection) ?? product.price;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: id,
            quantity,
            size: selectedSize,
            color: selectedFormat === 'Frame' ? selectedColor : undefined,
            format: selectedFormat,
            frameColor: selectedFormat === 'Frame' ? selectedColor : undefined,
            price: overridePrice,
            subsection: product.subsection,
          }),
        }
      );

      if (response.ok) {
        cartEvents.emit();
        navigate('/checkout');
      } else {
        toast.error('Failed to proceed to checkout');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      toast.error('Failed to proceed to checkout');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ productId: id }),
        }
      );

      if (response.ok) {
        toast.success('Added to wishlist');
      } else {
        toast.error('Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Add to wishlist error:', error);
      toast.error('Failed to add to wishlist');
    }
  };


  const mainImage = useMemo(() => {
    if (!product) return "";

    // If user clicked a thumbnail → always priority
    if (selectedImage) {
      return optimizeImage(selectedImage, 800);
    }

    // If Frame selected → use frame color images
    if (selectedFormat === "Frame") {
      const colorImg = product.imagesByColor?.[selectedColor];
      if (colorImg) return optimizeImage(colorImg, 800);
    }

    // Default → main product image
    return optimizeImage(product.image, 800);
  }, [product, selectedImage, selectedColor, selectedFormat]);




  if (loading) {
    return (
      <div className="min-h-screen dark-theme content-offset">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2" style={{ borderColor: '#14b8a6' }}></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen dark-theme content-offset">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold mb-4" style={{ color: '#e5e7eb' }}>Product Not Found</h1>
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-2 rounded-md text-white"
            style={{ backgroundColor: '#14b8a6' }}
          >
            Back to Shop
          </button>
        </div>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />

      {/* Decorative Squares (top) */}
      <div className="flex justify-between max-w-7xl mx-auto px-4 pt-12">
        <div className="flex gap-2">
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: '#334155' }}></div>
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: '#334155' }}></div>
        </div>

        <div className="flex gap-2">
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: '#334155' }}></div>
          <div className="w-10 h-10 border-2 rounded" style={{ borderColor: '#334155' }}></div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-6 text-sm flex items-center gap-2" style={{ color: '#cbd5e1' }}>
        <Home className="w-4 h-4" color="#94a3b8" />
        <Link to="/" className="hover:underline" style={{ color: '#e5e7eb' }}>Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/shop" className="hover:underline" style={{ color: '#e5e7eb' }}>Shop</Link>
        <ChevronRight className="w-4 h-4" />
        <span style={{ color: '#e5e7eb' }}>{product?.name || 'Product'}</span>
      </div>

      {/* Product Detail Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Image Box */}
          <div className="soft-card rounded-2xl bg-white p-4" style={{ color: '#94a3b8' }}>

            <div
              ref={imageContainerRef}
              className="rounded-lg overflow-hidden bg-black/5"
              style={{ height: "70vh", cursor: zoom > 1 ? "zoom-in" : "default" }}
              onMouseMove={(e) => updateOriginFromPoint(e.clientX, e.clientY)}
              onTouchMove={(e) => {
                if (e.touches && e.touches[0]) updateOriginFromPoint(e.touches[0].clientX, e.touches[0].clientY);
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: origin,
                  width: "100%",
                  height: "100%",
                  transition: "transform 0.2s ease-out",
                  willChange: "transform",
                }}
              >

                {/* 🔥 Image + Watermark Added Here */}
                <div className="relative w-full h-full protect-image">

                  {/* Main Product Image */}
                  <ImageWithFallback
                    src={mainImage}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain select-none"
                  />

                </div>

              </div>
            </div>


            {/* --- THUMBNAIL STRIP – COLOR IMAGES + EXTRA IMAGES + MAIN IMAGE --- */}
            <div className="relative">
              <button
                onClick={() => handleArrow("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border"
                style={{ borderColor: "#334155", backgroundColor: "rgba(2,6,23,0.6)", color: "#e5e7eb" }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div
                ref={thumbStripRef}
                className="thumbs-strip flex gap-3 overflow-x-auto pb-4 pt-4 no-scrollbar snap-x snap-mandatory"
                onWheel={handleThumbWheel}
                onKeyDown={handleThumbKeyDown}
                onTouchStart={handleThumbTouchStart}
                onTouchMove={handleThumbTouchMove}
                onTouchEnd={handleThumbTouchEnd}
              >
                {thumbItems.map((item, index) => (
                  <div
                    key={index}
                    className={`thumb-item w-20 h-20 rounded-lg border cursor-pointer overflow-hidden snap-center shrink-0 transition 
          ${item.selected ? "border-teal-500 shadow-md" : "border-gray-300"}`}
                    onClick={item.onClick}
                  >
                    <ImageWithFallback
                      src={optimizeImage(item.src, 160)}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                    {item.label && (
                      <span className="absolute bottom-1 left-1 text-[10px] px-2 py-0.5 rounded bg-black/60 text-white">
                        {item.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleArrow("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full border"
                style={{ borderColor: "#334155", backgroundColor: "rgba(2,6,23,0.6)", color: "#e5e7eb" }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>


            {/* Zoom Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="px-6 py-1 mt-6 rounded-lg border"
                style={{ borderColor: '#334155', color: '#e5e7eb', background: 'transparent' }}
              >
                Zoom In
              </button>

              <button
                onClick={() => setZoom((z) => Math.max(0.9, z - 0.2))}
                className="px-6 py-1 mt-6 rounded-lg border"
                style={{ borderColor: '#334155', color: '#e5e7eb', background: 'transparent' }}
              >
                Zoom Out
              </button>

              <button
                onClick={() => setZoom(1)}
                className="px-6 py-1 mt-6 rounded-lg border"
                style={{ borderColor: '#334155', color: '#e5e7eb', background: 'transparent' }}
              >
                Reset
              </button>
            </div>
            <div className="mt-4 rounded-2xl p-4 soft-card">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#e5e7eb' }}>Specifications</h3>
              <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: '#cbd5e1' }}>
                {product.material && <div><span style={{ color: '#94a3b8' }}>Material:</span> <span>{product.material}</span></div>}
                {product.layout && <div><span style={{ color: '#94a3b8' }}>Layout:</span> <span>{product.layout}</span></div>}
                {product.colors?.length > 0 && <div className="col-span-2"><span style={{ color: '#94a3b8' }}>Available Colors:</span> <span>{product.colors.join(', ')}</span></div>}
                {product.sizes?.length > 0 && <div className="col-span-2"><span style={{ color: '#94a3b8' }}>Sizes:</span> <span>{product.sizes.join(', ')}</span></div>}
              </div>
            </div>
          </div>





          {/* Product Info */}
          <div>

            <div className="flex items-center gap-2 mb-2 text-sm" style={{ color: '#cbd5e1' }}>



              <span className="px-6 py-2 rounded-lg border" style={{ borderColor: '#334155', color: '#e5e7eb' }}>{product.category}</span>
              {product.layout && <span className="px-6 py-2 rounded-lg border" style={{ borderColor: '#334155', color: '#e5e7eb' }}>{product.layout}</span>}
              {product.material && <span className="px-6 py-2 rounded-lg border" style={{ borderColor: '#334155', color: '#e5e7eb' }}>{product.material}</span>}
            </div>


            <h1 className="custom-heading">
              <span>{product.name}</span>
            </h1>

            <div className="mb-4 mt-6">
              <h3 className="custom-heading mb-1">
                <span className="w-5 h-5" color="#94a3b8">₹{(computePriceFor(selectedSize, selectedFormat, product.subsection) ?? product.price).toFixed(2)}</span>
              </h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                Tax included. <Link to="/terms" className="underline" style={{ color: '#e5e7eb' }}>Shipping</Link> calculated at checkout.
              </p>
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border" style={{ borderColor: '#334155' }} onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }} title="Copy Link">
                  <Copy className="w-5 h-5" color="#94a3b8" />
                </button>
                <button className="p-2 rounded-lg border" style={{ borderColor: '#334155' }} onClick={() => { if (navigator.share) { navigator.share({ title: product.name, url: window.location.href }).catch(() => { }); } else { toast.info('Use copy to share'); } }} title="Share">
                  <Share2 className="w-5 h-5" color="#94a3b8" />
                </button>
              </div>
            </div>

            {(product.rating || product.reviewsCount) && (
              <div className="flex items-center gap-2 mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5" color={i < Math.round(Number(product.rating || 0)) ? '#22c55e' : '#475569'} />
                ))}
                <span className="text-sm" style={{ color: '#cbd5e1' }}>{Number(product.rating || 0).toFixed(1)} {product.reviewsCount ? `(${product.reviewsCount} reviews)` : ''}</span>
              </div>
            )}

            {/* <p className="leading-relaxed mb-8" style={{ color: '#cbd5e1' }}>
              {product.description}
            </p> */}

            {/* Format (Rolled / Canvas / Frame) */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2" style={{ color: '#e5e7eb' }}>Material</h3>
              <div className="flex gap-3 rounded-lg">
                {(['Canvas', 'Frame'] as const).map((fmt) => {
                  const available = computePriceFor(selectedSize, fmt, product.subsection) !== undefined;
                  return (
                    <button
                      key={fmt}
                      onClick={() => available && setSelectedFormat(fmt)}
                      className={`px-6 py-2 rounded-lg border-2 transition ${selectedFormat === fmt ? 'border-teal-500 bg-teal text-white'
                        : ''
                        } ${available ? '' : 'opacity-50 cursor-not-allowed'}`}
                      style={{ borderColor: selectedFormat === fmt ? undefined : '#334155', color: selectedFormat === fmt ? undefined : '#e5e7eb' }}
                      title={available ? '' : 'Not available for this size'}
                      disabled={!available}
                    >
                      {fmt}
                    </button>
                  );
                })}
                <button onClick={() => { setSelectedColor(defaultColor); setSelectedSize(defaultSize); setSelectedFormat(defaultFormat); }} className="px-6 py-2 rounded-lg border" style={{ borderColor: '#334155', color: '#e5e7eb' }}>Clear</button>
              </div>

            </div>

            {/* Colors (only for Frame) */}
            {/* {product.colors?.length > 0 && selectedFormat === 'Frame' && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2" style={{ color: '#e5e7eb' }}>Frame</h3>
                <div className="flex gap-3">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-12 h-12 rounded-full border-2 transition ${
                        selectedColor === color
                          ? 'border-teal-500 shadow-lg'
                          : ''
                      }`}
                      style={{ backgroundColor: color, borderColor: selectedColor === color ? undefined : '#334155' }}
                    >
                      {selectedColor === color && (
                        <Check className="w-6 h-6 text-white m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )} */}




            {/* Sizes */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2" style={{ color: '#e5e7eb' }}>Size (in inches)</h3>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-2 rounded-lg border-2 transition ${selectedSize === size
                        ? 'border-teal-500 bg-teal text-white'
                        : ''
                        }`}
                      style={{ borderColor: selectedSize === size ? undefined : '#334155', color: selectedSize === size ? undefined : '#e5e7eb' }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Frame Options */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2" style={{ color: '#e5e7eb' }}>Frame</h3>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Without Frame (Rolled)', fmt: 'Rolled' as const, color: '' },
                  { label: 'Stretched Canvas', fmt: 'Canvas' as const, color: '' },
                  { label: 'Black Frame', fmt: 'Frame' as const, color: 'Black' },
                  { label: 'White Frame', fmt: 'Frame' as const, color: 'White' },
                  { label: 'Dark Wood Frame', fmt: 'Frame' as const, color: 'Brown' },
                ].map((opt) => {
                  const available = computePriceFor(selectedSize, opt.fmt, product.subsection) !== undefined;
                  const isActive =
                    selectedFormat === opt.fmt &&
                    (opt.fmt !== 'Frame' || selectedColor === opt.color || !opt.color);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => {
                        if (!available) return;
                        setSelectedFormat(opt.fmt);
                        if (opt.fmt === 'Frame') {
                          setSelectedColor(opt.color);
                        } else {
                          setSelectedColor('');
                        }
                      }}
                      className={`px-6 py-2 rounded-lg border-2 transition ${isActive ? 'border-teal-500 bg-teal text-white' : ''
                        } ${available ? '' : 'opacity-50 cursor-not-allowed'}`}
                      style={{ borderColor: isActive ? undefined : '#334155', color: isActive ? undefined : '#e5e7eb' }}
                      disabled={!available}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3" style={{ color: '#e5e7eb' }}>Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border"
                  style={{ borderColor: '#334155', color: '#e5e7eb' }}
                >
                  -
                </button>
                <span className="text-xl font-semibold" style={{ color: '#e5e7eb' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border"
                  style={{ borderColor: '#334155', color: '#e5e7eb' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mb-8">

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex-1 px-10 py-3 rounded-xl transition-all duration-200 tracking-widest"
                style={{ border: '1px solid #e5e7eb', backgroundColor: 'transparent', color: '#e5e7eb', fontWeight: 700 }}
              >
                <div className="flex gap-2 items-center justify-center">
                  <ShoppingCart className="w-5 h-5" color="#e5e7eb" />
                  ADD TO CART
                </div>
              </button>

              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="flex-1 px-10 py-3 rounded-xl text-black font-semibold transition-all duration-200 tracking-widest"
                style={{ backgroundColor: '#14b8a6', color: '#0b1220', fontWeight: 700 }}
              >
                BUY NOW
              </button>

              {/* Wishlist */}
              <button
                onClick={handleAddToWishlist}
                className="
      w-12 h-12 rounded-xl border-2 
      flex items-center justify-center
      border-gray-300 hover:border-teal-500
      hover:bg-teal-50 transition-all duration-200
    "
              >
                <Heart className="w-5 h-5 hover:text-teal-600" color="#94a3b8" />
              </button>

            </div>


            <div className="mt-6 rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 uppercase tracking-wider text-sm text-gray-900">
                <div className="flex items-center gap-3 "><Truck className="w-5 h-5" color="#14b8a6" /><span>Free Delivery in 7–10 Days</span></div>
                <div className="flex items-center gap-3"><Package className="w-5 h-5" color="#14b8a6" /><span>4‑Layer Secure Packaging</span></div>
                <div className="flex items-center gap-3"><Lock className="w-5 h-5" color="#14b8a6" /><span>Secure Payments</span></div>
                <div className="flex items-center gap-3"><CheckSquare className="w-5 h-5" color="#14b8a6" /><span>Partial Cash on Delivery</span></div>
              </div>
              <div className="border-t border-gray-200" />

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">Top Quality, Check</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <div className="mt-3 space-y-2 text-gray-800">
                  <div className="flex items-start gap-2"><CheckCircle className="w-5 h-5" color="#14b8a6" /><span>Colors that stay bright, printed on 400 GSM premium canvas.</span></div>
                  <div className="flex items-start gap-2"><CheckCircle className="w-5 h-5" color="#14b8a6" /><span>Built by hand with pinewood frames that last for years.</span></div>
                  <div className="flex items-start gap-2"><CheckCircle className="w-5 h-5" color="#14b8a6" /><span>Soft matte look that feels calm, elegant, and glare‑free.</span></div>
                </div>
              </details>

              <div className="border-t border-gray-200" />

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <CircleHelp className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">How Will I Hang It?</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  Simply hammer in the included nails at your chosen spot. Then, carefully unbox and unwrap the frame. Hang it on the nails using the pre‑attached hooks. For our Stretched Canvas, no hooks are needed — just rest the top edge directly on the nails for a sleek, seamless look.
                </p>
              </details>

              <div className="border-t border-gray-200" />

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">Can I Return My Order?</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  At Decorizz, we want you to love your purchase. If needed, you can return items within 48 hours for easy replacements or store credit. Our hassle‑free return process ensures quick resolution for any issues.
                </p>
              </details>

              <div className="border-t border-gray-200" />

              <details className="group" open>
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" color="#14b8a6" />
                    <span className="uppercase tracking-wider text-sm text-gray-900">About This Artwork</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition" />
                </summary>
                <p className="mt-3 text-sm text-gray-700">
                  {product.description}
                </p>
              </details>
            </div>

            {/* Specifications */}
            {/* {product.material && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-2xl font-semibold mb-4">Specifications</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>Material:</span>
                    <span>{product.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Colors:</span>
                    <span>{product.colors.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sizes:</span>
                    <span>{product.sizes.join(', ')}</span>
                </div>

        </div>

      
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 backdrop-blur border-t border-gray-200 p-3 z-40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">₹{(computePriceFor(selectedSize, selectedFormat, product.subsection) ?? product.price).toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddToCart} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-800">Add</button>
              <button onClick={handleBuyNow} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#14b8a6' }}>Buy Now</button>
            </div>
          </div>
        </div>

      </div>
            )} */}
          </div>

        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="custom-heading font-bold text-center mb-12">
              Related <span style={{ color: "#14b8a6" }}>Frames</span>
            </h2>


            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <LazyShow key={product.id}>
                  <ProductCard product={product} />
                </LazyShow>
              ))}
            </div>
          </div>

        )}


      </div>

      <Footer />
    </div>
  );
}
