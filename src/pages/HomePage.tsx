import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ProductCard } from "../components/ProductCard";
import { Star, Leaf, Palette, Brush, ShieldCheck, Play } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import owl from "../assets/owl.jpg";
import batman from "../assets/batman.png";
import monkey from "../assets/monkey.png";

import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "../components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  createdAt?: string;
  colors?: string[];
  sizes?: string[];
}

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  profileImage?: string;
}

interface VideoItem {
  id: string;
  title: string;
  url: string;
  caption?: string;
  thumbnail?: string;
  productId?: string | null;
}

export default function HomePage() {
  const heroPlugins = useMemo(() => [Autoplay({ delay: 3000, stopOnInteraction: false })], []);
  const bestPlugins = useMemo(() => [Autoplay({ delay: 3000, stopOnInteraction: false })], []);
  const latestPlugins = useMemo(() => [Autoplay({ delay: 3500, stopOnInteraction: false })], []);
  const watchPlugins = useMemo(() => [Autoplay({ delay: 3000, stopOnInteraction: false })], []);
  const testimonialPlugins = useMemo(() => [Autoplay({ delay: 4000, stopOnInteraction: false })], []);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroApi, setHeroApi] = useState<CarouselApi | null>(null);
  const [formatFilter, setFormatFilter] = useState<'All' | 'Rolled' | 'Canvas' | 'Frame'>('All');
  const [bestApi, setBestApi] = useState<CarouselApi | null>(null);
  const [bestSelected, setBestSelected] = useState(0);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [testApi, setTestApi] = useState<CarouselApi | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [watchVideos, setWatchVideos] = useState<VideoItem[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [justInApi, setJustInApi] = useState<CarouselApi | null>(null);
  const [justInSelected, setJustInSelected] = useState(0);
  const [watchApi, setWatchApi] = useState<CarouselApi | null>(null);

  const computeTags = () => {
    const words = new Set<string>();
    featuredProducts.forEach((p: any) => {
      (p.name || '').split(/\s+/).forEach((w: string) => {
        const clean = w.replace(/[^A-Za-z]/g, '');
        const pick = clean.toLowerCase();
        const allow = ['lion', 'zebra', 'owl', 'rama', 'virat', 'horses', 'canvas', 'frame', 'black'];
        if (allow.includes(pick)) words.add(clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
      });
    });
    const list = Array.from(words);
    return list.length ? list.slice(0, 6) : ['Lion', 'Black', 'Rama', 'Owl', 'Virat', 'Horses'];
  };
  const tags = computeTags();

  // Removed obsolete fetchHomeData useEffect; data fetching now handled by fetchAllData effect.

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      disable: 'mobile'
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [featuredProducts, testimonials, watchVideos, newProducts, loading]);

  // Combined data fetching with parallel requests and abort support
  const fetchAllData = useCallback(async (signal: AbortSignal) => {
    try {
      const [productsRes, testimonialsRes, videosRes, faqsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal,
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal,
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
          signal,
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/faqs`, { signal }),
      ]);

      // Products
      const productsData = await productsRes.json();
      setFeaturedProducts(productsData.products?.slice(0, 20) || []);
      const allProducts: Product[] = productsData.products || [];
      const sortedNew = [...allProducts].sort((a: any, b: any) => {
        const ta = a.createdAt || a.created_at ? new Date(a.createdAt || a.created_at).getTime() : 0;
        const tb = b.createdAt || b.created_at ? new Date(b.createdAt || b.created_at).getTime() : 0;
        return tb - ta;
      });
      setNewProducts(sortedNew.slice(0, 20));





      // Testimonials
      const testimonialsData = await testimonialsRes.json();
      setTestimonials(testimonialsData.testimonials?.slice(0, 4) || []);

      // Videos
      const videosData = await videosRes.json();
      setWatchVideos((videosData.videos || []).slice(0, 10));

      // FAQs
      const faqsData = await faqsRes.json();
      setFaqs(faqsData.faqs || []);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Homepage fetch error:", error);
      }
    } finally {
      setLoading(false);
      setFaqsLoading(false);
    }
  }, []);

  // Initial load with abort handling
  useEffect(() => {
    const controller = new AbortController();
    fetchAllData(controller.signal);
    return () => controller.abort();
  }, [fetchAllData]);

  // Remove separate fetchFaqs useEffect – FAQs are now loaded in fetchAllData

  // fetchFaqs and its useEffect removed; FAQs are now fetched in fetchAllData.



  useEffect(() => {
    if (!bestApi) return;

    const onSelect = () => {
      setBestSelected(bestApi.selectedScrollSnap());
    };

    bestApi.on("select", onSelect);

    return () => {
      bestApi.off("select", onSelect);
    };
  }, [bestApi]);
  useEffect(() => {
    if (!justInApi) return;
    const onSelect = () => {
      setJustInSelected(justInApi.selectedScrollSnap());
    };
    justInApi.on("select", onSelect);
    return () => {
      justInApi.off("select", onSelect);
    };
  }, [justInApi]);

  const bestSellerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollBestSellerLeft = () => {
    if (!bestSellerRef.current) return;
    const { clientWidth } = bestSellerRef.current;
    bestSellerRef.current.scrollBy({ left: -clientWidth, behavior: "smooth" });
  };

  const scrollBestSellerRight = () => {
    if (!bestSellerRef.current) return;
    const { clientWidth } = bestSellerRef.current;
    bestSellerRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });
  };

  const [viewportW, setViewportW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setViewportW(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const heroImagesDesktop = [owl, batman, monkey];
  const heroImagesMobile = [owl, batman, monkey];

  const heroImages = viewportW < 768 ? heroImagesMobile : heroImagesDesktop;

  return (
    <main className="min-h-screen dark-theme content-offset" role="main">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section" aria-label="Hero Banner">
        {/* Floating Decorative Elements */}
        <div className="hero-floating-circle hero-floating-circle-1" aria-hidden="true" />
        <div className="hero-floating-circle hero-floating-circle-2" aria-hidden="true" />
        <div className="hero-floating-circle hero-floating-circle-3" aria-hidden="true" />

        <Carousel
          key={newProducts.length}
          plugins={heroPlugins}
          opts={{
            loop: true,
            align: "center",
            slidesToScroll: 1,
          }}
          setApi={setHeroApi}
          className="w-full"
        >
          <CarouselContent className="ml-0 gap-0">
            {heroImages.map((src, idx) => (
              <CarouselItem key={idx} className="basis-full min-w-full pl-0">
                <div className="relative w-full">
                  <img
                    src={src}
                    alt={`Premium decorative wall frame collection - Slide ${idx + 1}`}
                    className="hero-image"
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding={idx === 0 ? "auto" : "async"}
                  />
                  <div className="hero-overlay hero-gradient-overlay" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex" aria-label="Previous slide" />
          <CarouselNext className="hidden lg:flex" aria-label="Next slide" />
        </Carousel>

        <div className="hero-content mt-24">
          <div className=" p-4 sm:p-16 sm:text-left">
            <h1 className="hero-title hero-title-animated mt-24">
              <span className="text-white">Discover</span>{" "}
              <span className="accent shimmer-text">300+</span>{" "}

              <span className="text-white">Modern</span>
            </h1>
            <p className="custom-heading mt-2">
              <span className="text-white">Premium Wall Frames & Canvas</span>
            </p>
            {/* <div className="hero-buttons justify-center sm:justify-start mt-6">
              <Link
                to="/shop"
                className="btn-glow-teal text-white px-8 rounded-lg py-3 font-semibold"
                aria-label="Browse our frame collection"
              >
                Shop Now
              </Link>
              <Link
                to="/contact"
                className="btn-outline-glow px-8 rounded-lg py-3 font-semibold"
                aria-label="Contact us for inquiries"
              >
                Contact Us
              </Link>
            </div> */}
            {/* <p className="hero-caption sm:pl-4 mt-4">300+ Collection of premium wall frames for your home decor</p> */}
          </div>
        </div>
      </section>

      {/* Explore Frames Section */}
      <section className="best-section best-section-enhanced max-w-7xl mx-auto px-4 py-16 lg:py-20 relative overflow-hidden" aria-label="Explore Our Frame Collection">
        {/* Decorative Elements */}
        <div className="deco-circle deco-circle-teal float-element-slow" style={{ width: '200px', height: '200px', top: '-50px', right: '-50px' }} aria-hidden="true" />
        <div className="deco-circle deco-circle-brown float-element" style={{ width: '150px', height: '150px', bottom: '-30px', left: '-30px' }} aria-hidden="true" />

        <div className="text-center mb-8 fade-up">
          <h2 className="custom-heading section-header-glow ml-6 pb-2 border-b-2 border-[#14b8a6] inline-block">
            <span className="text-[#3b2f27]">Explore</span>
            <span style={{ color: "#14b8a6" }}> Frames</span>
          </h2>
        </div>

        <div className="flex justify-center gap-3 mb-12">
          {(['All', 'Canvas', 'Frame'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setFormatFilter(opt)}
              className={`pill ${formatFilter === opt ? 'active' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="skeleton skeleton-img" style={{ aspectRatio: '4 / 5' }} />
                <div className="p-4">
                  <div className="skeleton skeleton-line lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative mb-12">
            <Carousel
              plugins={bestPlugins}

              opts={{ loop: true, align: "center", slidesToScroll: 1 }}
              setApi={setBestApi}
              className="w-full overflow-hidden"
            >
              <CarouselContent className="gap-6">
                {featuredProducts
                  .filter((p: any) => formatFilter === "All" ? true : p.format === formatFilter)
                  .map((p: any, idx: number) => {
                    const total = featuredProducts.filter((x: any) =>
                      formatFilter === "All" ? true : x.format === formatFilter
                    ).length;

                    const leftIndex = (bestSelected - 1 + total) % total;
                    const rightIndex = (bestSelected + 1) % total;

                    const isCenter = idx === bestSelected;
                    const isLeft = idx === leftIndex;
                    const isRight = idx === rightIndex;

                    let positionClass = "best-item-side";
                    if (isCenter) positionClass = "";
                    else if (isLeft) positionClass = "best-item-left";
                    else if (isRight) positionClass = "best-item-right";

                    return (
                      <CarouselItem
                        key={p.id || idx}
                        className="best-carousel-item basis-full sm:basis-1/2 lg:basis-1/3 flex justify-center"
                      >
                        <Link to={`/product/${p.id}`} className={`best-item ${positionClass}`}>
                          <article className="best-card cursor-pointer"
                            style={{ aspectRatio: isCenter ? "4 / 5" : "4 / 4" }}
                          >
                            <img src={p.image} alt={`${p.name} - Premium wall frame for home decor`} loading="lazy" decoding="async" />
                            <div className="best-caption">{p.name}</div>
                          </article>
                        </Link>
                      </CarouselItem>
                    );
                  })}
              </CarouselContent>

              <CarouselPrevious className="best-nav-btn left-0">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </CarouselPrevious>

              <CarouselNext className="best-nav-btn right-0">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </CarouselNext>
            </Carousel>

            <div className="best-click-left" onClick={() => bestApi?.scrollPrev()}></div>
            <div className="best-click-right" onClick={() => bestApi?.scrollNext()}></div>
          </div>
        )}
      </section>

      <section className="w-full mx-auto px-4 py-12 lg:py-20 relative overflow-hidden bg-white">
        <div className="text-center mb-12">
          <h2 className="custom-heading mb-4 pb-2 border-b-2 border-[#14b8a6] inline-block">
            <span className="text-[#3b2f27]">Watch</span>
            <span style={{ color: "#14b8a6" }}> & Buy</span>
          </h2>
          <p className="text-gray-600 mt-3">See frames in action and shop the look</p>
        </div>

        {watchVideos.length > 0 ? (
          <div className="relative mb-12 max-w-7xl mx-auto">
            <Carousel
              opts={{ loop: true, align: "center", slidesToScroll: 1 }}
              setApi={setWatchApi}
              className="w-full overflow-hidden"
            >
              <CarouselContent className="gap-6">
                {watchVideos.map((v) => {
                  const isYouTube = /youtube\.com|youtu\.be/.test(v.url || '');
                  const ytIdMatch = v.url?.match(/v=([^&]+)/) || v.url?.match(/youtu\.be\/([^?]+)/) || v.url?.match(/embed\/([^?]+)/);
                  const ytId = ytIdMatch ? ytIdMatch[1] : '';
                  return (
                    <CarouselItem key={v.id} className="best-carousel-item basis-full sm:basis-1/2 lg:basis-1/3 flex justify-center">
                      <Link to="/shop-by-videos" className="best-item card-hover-glow">
                        <div className="best-card cursor-pointer" style={{ aspectRatio: '7/10' }}>
                          {isYouTube && ytId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                              className="w-full h-full object-cover pointer-events-none rounded-2xl"
                              allow="autoplay; encrypted-media"
                              allowFullScreen
                              title={v.title}
                            />
                          ) : (
                            <video
                              src={v.url}
                              className="w-full object-cover rounded-lg"
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          )}
                          <div className="best-caption">{v.title}</div>
                        </div>
                      </Link>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <CarouselPrevious className="best-nav-btn left-0">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </CarouselPrevious>

              <CarouselNext className="best-nav-btn right-0">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </CarouselNext>
            </Carousel>

            <div className="best-click-left" onClick={() => watchApi?.scrollPrev()}></div>
            <div className="best-click-right" onClick={() => watchApi?.scrollNext()}></div>
          </div>
        ) : (
          <p className="text-center text-gray-500">No videos available yet.</p>
        )}

        <div className="text-center mt-12">
          <Link
            to="/shop-by-videos"
            className="inline-block px-6 py-3 rounded-lg premium-btn text-white font-semibold hover:scale-105 transition-transform"
            style={{ backgroundColor: '#14b8a6' }}
          >
            View All Videos
          </Link>
        </div>
      </section>



      {/* Why Choose Us Section */}
      <section className="py-16 lg:py-20 relative best-section" aria-label="Why Choose Decorizz">
        {/* Decorative Floating Elements */}
        <div className="deco-circle deco-circle-teal float-element-slow" style={{ width: '180px', height: '180px', top: '10%', left: '-60px' }} aria-hidden="true" />
        <div className="deco-circle deco-circle-brown float-element" style={{ width: '120px', height: '120px', bottom: '20%', right: '-40px' }} aria-hidden="true" />

        <div className="absolute right-8 top-12 hidden lg:flex flex-col gap-2" aria-hidden="true">
          <div className="w-10 h-10 border-2 rounded float-element" style={{ borderColor: "#14b8a6" }} />
          <div className="w-10 h-10 border-2 rounded float-element-slow" style={{ borderColor: "#14b8a6" }} />
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="section-title section-header-glow font-extrabold mb-4 ml-6 pb-2 border-b-2 border-[#14b8a6] mt-6 inline-block">
              <span className="text-[#3b2f27]">Why</span>
              <span style={{ color: "#14b8a6" }}> Choose Us</span>
            </h2>
            <p className="ml-6 max-w-2xl mx-auto text-center" style={{ color: "#cbd5e1" }}>
              Your confidence in our products is paramount. We stand behind every
              piece with unwavering guarantee and dedication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: "Sourcing",
                desc: "Ethically sourced materials from sustainable forests and trusted artisan partners worldwide.",
                icon: Leaf,
              },
              {
                title: "Design",
                desc: "Contemporary and timeless designs crafted to complement any home aesthetic perfectly.",
                icon: Palette,
              },
              {
                title: "Crafting",
                desc: "Handcrafted by skilled artisans using time-honored techniques and precision tools.",
                icon: Brush,
              },
              {
                title: "Quality Assurance",
                desc: "Every frame undergoes rigorous quality checks to ensure it meets our standards.",
                icon: ShieldCheck,
              },
            ].map((item, idx) => (
              <article
                key={idx}
                className="why-choose-card curve-card fade-up soft-card"
                style={{
                  borderRadius: "50px",
                  padding: "22px",
                  minHeight: "30px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  border: "2px solid #14b8a6",
                }}
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div
                  className="icon-gradient-bg w-20 h-20 rounded-full flex items-center justify-center mb-3"
                >
                  {(() => {
                    const Icon = (item as any).icon;
                    return <Icon className="w-10 h-10" color="#ffffff" aria-hidden="true" />;
                  })()}
                </div>

                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "Georgia, serif", color: "#e5e7eb" }}
                >
                  {item.title}
                </h3>

                <p className="leading-relaxed" style={{ color: "#cbd5e1" }}>
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="best-section max-w-7xl mx-auto px-4 py-16 lg:py-20 relative overflow-hidden">
        <div className="text-center mb-10 ml-6">
          <h2 className="custom-heading mb-4 pb-2 border-b-2 border-[#14b8a6] mt-6 inline-block">
            <span className="text-[#3b2f27]">Latest</span>
            <span className="text-[#14b8a6]"> Upload Products Here</span>
          </h2>

          <p className="mt-3 mb-6 text-gray-500">
            New arrivals curated by our design team
          </p>
        </div>

        {newProducts.length > 0 ? (
          <div className="relative">
            <Carousel

              opts={{
                loop: true,
                align: "center",
                slidesToScroll: 1,
              }}
              setApi={setJustInApi}
              className="w-full overflow-hidden"
            >
              <CarouselContent className="gap-6">
                {newProducts.map((p: any, idx: number) => {
                  const total = newProducts.length;
                  const leftIndex = (justInSelected - 1 + total) % total;
                  const rightIndex = (justInSelected + 1) % total;
                  const isCenter = idx === justInSelected;
                  const isLeft = idx === leftIndex;
                  const isRight = idx === rightIndex;
                  let positionClass = "best-item-side";
                  if (isCenter) positionClass = "";
                  else if (isLeft) positionClass = "best-item-left";
                  else if (isRight) positionClass = "best-item-right";
                  return (
                    <CarouselItem
                      key={p.id || idx}
                      className="best-carousel-item basis-full sm:basis-1/2 lg:basis-1/3 flex justify-center"
                    >
                      <Link to={`/product/${p.id}`} className={`best-item ${positionClass}`}>
                        <div
                          className="best-card cursor-pointer"
                          style={{ aspectRatio: isCenter ? "4 / 5" : "4 / 4" }}
                        >
                          <img src={p.image} alt={p.name} loading="lazy" decoding="async" />
                          <div className="best-caption">{p.name}</div>
                        </div>
                      </Link>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <CarouselPrevious className="best-nav-btn left-0 z-10">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </CarouselPrevious>
              <CarouselNext className="best-nav-btn right-0 z-10">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </CarouselNext>
            </Carousel>



          </div>
        ) : (
          <p className="text-center text-gray-500">No new arrivals yet.</p>
        )}
      </section>




      {/* TESTIMONIALS */}
      {loading ? (
        <section className="py-16 lg:py-20 bg-[#faf7f4]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 rounded-lg bg-white shadow-sm">
                  <div className="flex items-start mb-4 gap-3">
                    <div className="skeleton rounded-full w-12 h-12" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton skeleton-line lg w-1/2" />
                      <div className="skeleton skeleton-line sm w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="skeleton skeleton-line lg w-full" />
                    <div className="skeleton skeleton-line lg w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : testimonials.length > 0 && (
        <section className="py-16 lg:py-20 bg-[#faf7f4] relative" aria-label="Customer Testimonials">

          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <h2 className="custom-heading section-header-glow" style={{ fontWeight: 700 }}>
                What <span className="text-primary">People </span>Say <span className="text-primary">About </span>Us
              </h2>
              <div className="flex items-center justify-center gap-3 mb-3" aria-hidden="true">
                <span className="w-2 h-2 rounded-full" style={{ background: '#14b8a6' }} />
                <span className="w-40 border-t-2" style={{ borderColor: '#14b8a6' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#14b8a6' }} />
              </div>
              <p className="text-gray-600">Real transformations from discerning homeowners who trust Decorizz</p>
            </div>

            <div className="mb-12 mt-6">
              <Carousel plugins={testimonialPlugins} opts={{ loop: true, align: "center", slidesToScroll: 1 }} setApi={setTestApi} className="w-full overflow-hidden testimonial-carousel">
                <CarouselContent className="ml-0 sm:ml-2 gap-4 sm:gap-6">
                  {testimonials.map((t) => (
                    <CarouselItem
                      key={t.id}
                      className="testimonial-item flex-none w-full sm:w-1/2 lg:w-1/3 px-2"
                      data-slot="carousel-item"
                    >
                      <article
                        className="testimonial-card-enhanced soft-card bg-white border rounded-xl flex flex-col justify-between min-h-[220px]"
                        data-aos="fade-up"
                      >
                        <div className="p-4 sm:p-6">

                          {/* PROFILE */}
                          <div className="flex items-start mb-4 gap-3">
                            <img
                              src={t.profileImage || ""}
                              alt={`${t.name} - Customer testimonial`}
                              className="w-12 h-12 rounded-full object-cover bg-gray-100 flex-shrink-0 img-fade"
                            />

                            <div className="flex-1">
                              <p className="text-gray-900 font-semibold">{t.name}</p>

                              <div className="flex mt-1" role="img" aria-label={`${t.rating} out of 5 stars`}>
                                {Array.from({ length: t.rating }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 text-yellow-400"
                                    style={{ fill: "#facc15" }}
                                    aria-hidden="true"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* TEXT – strict 3-line clamp */}
                          <blockquote className="text-gray-700 leading-relaxed line-clamp-3 flex-1">
                            {t.text}
                          </blockquote>
                        </div>
                      </article>
                    </CarouselItem>


                  ))}
                </CarouselContent>

              </Carousel>
            </div>

            <div className="text-center">
              <Link
                to="/testimonials"
                className="pill active"


              >
                View Customer Gallery
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqsLoading ? (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-white shadow-sm p-4">
                <div className="skeleton skeleton-line lg w-2/3 mb-2" />
                <div className="skeleton skeleton-line lg w-full mb-2" />
                <div className="skeleton skeleton-line lg w-5/6" />
              </div>
            ))}
          </div>
        </section>
      ) : faqs.length > 0 && (
        <section className="faq-dark mb-12" aria-label="Frequently Asked Questions">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="custom-heading section-header-glow text-center mb-8">
              <span style={{ color: '#14b8a6' }}>Frequently Asked</span> Questions
            </h2>
            <div className="faq-list" role="list">
              {faqs.map((f) => {
                const isOpen = openFaq === f.id;

                return (
                  <details
                    key={f.id}
                    open={isOpen}
                    className="faq-item faq-item-enhanced group"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenFaq(isOpen ? null : f.id);
                    }}
                  >
                    <summary className="faq-summary" aria-expanded={isOpen}>
                      <span className="faq-icon faq-icon-animated">
                        <span className={`plus ${isOpen ? "hidden" : "inline"}`}>+</span>
                        <span className={`minus ${isOpen ? "inline" : "hidden"}`}>−</span>
                      </span>
                      <span className="faq-question">{String(f.question).toUpperCase()}</span>
                    </summary>

                    {isOpen && (
                      <div className="faq-answer">
                        {f.answer}
                      </div>
                    )}
                  </details>
                );
              })}

            </div>
          </div>
        </section>
      )}

      <Footer />

    </main>
  );
}
