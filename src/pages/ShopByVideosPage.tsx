import React, { useEffect, useRef, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { projectId } from '../utils/supabase/info';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { toast } from 'sonner';
import { Heart, MessageCircle, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type VideoItem = {
  id: string;
  title: string;
  url: string;
  caption?: string;
  thumbnail?: string;
  productId?: string | null;
};

export default function ShopByVideosPage() {
  const { user, accessToken } = useContext(AuthContext);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<VideoItem | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => { fetchVideos(); }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`);
      const data = await res.json();
      setVideos(data.videos || []);

      const likeCounts: Record<string, number> = {};
      await Promise.all((data.videos || []).map(async (v: any) => {
        const r = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${v.id}/likes`);
        const d = await r.json();
        likeCounts[v.id] = d.count || 0;
      }));
      setLikes(likeCounts);
    } finally { setLoading(false); }
  };

  const isYouTube = (url: string) => /youtube\.com|youtu\.be/.test(url);
  const getYouTubeId = (url: string) => {
    const m1 = url.match(/v=([^&]+)/);
    const m2 = url.match(/youtu\.be\/([^?]+)/);
    const m3 = url.match(/embed\/([^?]+)/);
    return m1?.[1] || m2?.[1] || m3?.[1] || '';
  };

  // 🔥 TRUE DIRECT STREAMING URL FOR GOOGLE DRIVE
  const getDriveDirectVideoUrl = (url: string) => {
    const fileMatch = url.match(/\/file\/d\/([^/]+)/);
    const paramMatch = url.match(/[?&]id=([^&]+)/);
    const id = fileMatch?.[1] || paramMatch?.[1];
    if (!id) return "";

    // m22 = 720p — best for autoplay
    return `https://lh3.googleusercontent.com/d/${id}=m22`;
  };


  const isGoogleDrive = (url: string) => /drive\.google\.com/.test(url);
  const getDriveEmbedUrl = (url: string) => {
    const fileMatch = url.match(/\/file\/d\/([^/]+)/);
    const idParam = url.match(/[?&]id=([^&]+)/);
    const id = fileMatch?.[1] || idParam?.[1];
    return id ? `https://drive.google.com/file/d/${id}/preview` : url;
  };
  const getDriveDownloadUrl = (url: string) => {
    const fileMatch = url.match(/\/file\/d\/([^/]+)/);
    const idParam = url.match(/[?&]id=([^&]+)/);
    const id = fileMatch?.[1] || idParam?.[1];
    return id ? `https://drive.google.com/uc?export=download&id=${id}` : '';
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const postYouTubeCommand = (iframe: HTMLIFrameElement, command: 'playVideo' | 'pauseVideo') => {
      try {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: command, args: [] }),
          '*'
        );
      } catch { }
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video') as HTMLVideoElement | null;
        const iframe = entry.target.querySelector('iframe') as HTMLIFrameElement | null;

        if (video) {
          if (entry.isIntersecting) {
            video.muted = true;
            video.play().catch(() => { });
          } else video.pause();
        }

        if (iframe && /youtube\.com\/embed/.test(iframe.src)) {
          if (entry.isIntersecting) postYouTubeCommand(iframe, 'playVideo');
          else postYouTubeCommand(iframe, 'pauseVideo');
        }
      });
    }, { threshold: 0.4 });

    Array.from(el.querySelectorAll('.sbv-card')).forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, [videos]);

  // Kickstart autoplay for first visible item on mount
  useEffect(() => {
    if (loading) return;
    const el = containerRef.current;
    if (!el) return;
    const first = el.querySelector('.sbv-card') as HTMLElement | null;
    if (!first) return;
    const v = first.querySelector('video') as HTMLVideoElement | null;
    const y = first.querySelector('iframe') as HTMLIFrameElement | null;
    if (v) { v.muted = true; v.play().catch(() => { }); }
    if (y && /youtube\.com\/embed/.test(y.src)) {
      try { y.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*'); } catch { }
    }
  }, [loading]);

  const toggleLike = async (id: string) => {
    try {
      if (!user) return toast.error('Login to like');

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Failed');

      setLikes(prev => ({ ...prev, [id]: d.count }));
    } catch { toast.error('Failed'); }
  };

  const addToCart = async (v: VideoItem) => {
    try {
      if (!user) return toast.error('Login to add to cart');
      if (!v.productId) return toast.error('No related product');

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ productId: v.productId, quantity: 1 })
      });

      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Failed');

      toast.success('Added to cart');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />

      {/* HERO HEADER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto mb-6">
          <div className="soft-card p-8 sm:p-12 card-appear">
            <h1 className="text-center custom-heading">
              Shop by <span style={{ color: "#14b8a6" }}>Videos</span>
            </h1>
            <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#cbd5e1" }}>
              Explore our videos and shop the looks.
            </p>
          </div>
        </div>



        {/* LOADING SKELETON */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="skeleton skeleton-img" style={{ aspectRatio: '16 / 9' }} />
                <div className="p-4 space-y-2">
                  <div className="skeleton skeleton-line lg w-3/4" />
                  <div className="skeleton skeleton-line sm w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (

          /**********************
           *  MAIN VIDEO GRID
           **********************/
          <div className="sbv-grid">
            {videos.map(v => (
              <div key={v.id} className="sbv-card">

                {/* 🔥 UPDATED AUTOPLAY MEDIA BLOCK */}
                <div className="sbv-media">
                  {isYouTube(v.url) ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(v.url)}?enablejsapi=1&autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${getYouTubeId(v.url)}`}
                      title={v.title}
                      className="sbv-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isGoogleDrive(v.url) ? (
                    (() => {
                      const stream = getDriveDirectVideoUrl(v.url);

                      // If direct MP4 stream is available → autoplay video
                      if (stream) {
                        return (
                          <video
                            src={stream}
                            className="sbv-video object-cover"
                            autoPlay
                            muted
                            playsInline
                            loop
                            preload="auto"
                          />
                        );
                      }

                      // Fallback to preview iframe
                      return (
                        <iframe
                          src={`${getDriveEmbedUrl(v.url)}?autoplay=1&mute=1`}
                          title={v.title}
                          className="sbv-video"
                          allow="autoplay; fullscreen"
                          referrerPolicy="no-referrer"
                          allowFullScreen
                        />
                      );
                    })()
                  )
                    : (
                      <video
                        src={v.url}
                        className="sbv-video object-cover"
                        playsInline
                        muted
                        autoPlay
                        loop
                        preload="auto"
                      />
                    )}

                  <div className="sbv-actions">
                    <button className="p-2 rounded-full bg-white shadow" onClick={() => toggleLike(v.id)}>
                      <Heart className="w-5 h-5" />
                    </button>
                    <span className="text-xs text-gray-700">{likes[v.id] || ""}</span>

                    <button className="p-2 rounded-full bg-white shadow" onClick={() => setOpen(v)}>
                      <MessageCircle className="w-5 h-5" />
                    </button>

                    <button className="p-2 rounded-full bg-white shadow" onClick={() => addToCart(v)}>
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* TITLE + CAPTION + CTA */}
                <div className="sbv-overlay">
                  <div className="sbv-title">{v.title}</div>
                  {v.caption && <div className="sbv-sub">{v.caption}</div>}

                  <div className="sbv-cta">
                    {v.productId ? (
                      <Link to={`/product/${v.productId}`} className="premium-btn-white">
                        Shop Now
                      </Link>
                    ) : (
                      <button className="premium-btn-white" onClick={() => setOpen(v)}>
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : (
          <p className="text-center text-gray-500 py-12">No videos available yet.</p>
        )}
      </section>

      {/* VIDEO POPUP MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(null)}>
          <div className="bg-white rounded-xl shadow-xl w-[94vw] md:w-[900px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            <div className="relative" style={{ aspectRatio: '16 / 9' }}>
              {isYouTube(open.url) ? (
                <iframe
                  src={open.url.replace('watch?v=', 'embed/')}
                  title={open.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                />
              ) : isGoogleDrive(open.url) ? (
                <iframe
                  src={getDriveEmbedUrl(open.url)}
                  title={open.title}
                  className="w-full h-full"
                  allow="autoplay"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                />
              ) : (
                <video src={open.url} controls className="w-full h-full" />
              )}
            </div>

            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900">{open.title}</h3>
              {open.caption && <p className="text-gray-700 mt-1">{open.caption}</p>}
              <CommentBox videoId={open.id} />

              <div className="mt-4 flex justify-end">
                <button className="premium-btn-white" onClick={() => setOpen(null)}>Close</button>
              </div>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/**********************
 * COMMENT COMPONENT
 **********************/
function CommentBox({ videoId }: { videoId: string }) {
  const { user, accessToken } = useContext(AuthContext);
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => { fetchComments(); }, [videoId]);

  const fetchComments = async () => {
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${videoId}/comments`);
    const d = await res.json();
    setItems(d.comments || []);
  };

  const submit = async () => {
    if (!user) return toast.error('Login to comment');

    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${videoId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ text })
    });

    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'Failed');

    setText('');
    fetchComments();
  };

  return (
    <div className="mt-4">
      <div className="space-y-2 max-h-48 overflow-auto">
        {items.map((c: any) => (
          <div key={c.id} className="border rounded px-3 py-2">
            <p className="text-sm font-semibold text-gray-900">{c.userName}</p>
            <p className="text-sm text-gray-700">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a comment"
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={submit} className="premium-btn">Post</button>
      </div>
    </div>
  );
}
