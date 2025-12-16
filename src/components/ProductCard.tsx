import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { wishlistEvents } from '../utils/wishlistEvents';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AuthContext } from '../context/AuthContext';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner';
import { optimizeImage } from "../utils/optimizeImage";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  colors?: string[];
  sizes?: string[];
};

type ProductCardProps = {
  product: Product;
  overridePrice?: number;
  eyeNavigates?: boolean;
  hideCategory?: boolean;
  hideColors?: boolean;
  aspectRatio?: string;
};

function ProductCardComponent({
  product,
  overridePrice,
  eyeNavigates,
  hideCategory = false,
  hideColors = false,
  aspectRatio = "aspect-square"
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, accessToken } = useContext(AuthContext);
  const truncatedName = (() => {
    const words = (product.name || '').trim().split(/\s+/);
    return words.length <= 4 ? product.name : words.slice(0, 4).join(' ') + '…';
  })();

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to add to wishlist");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/wishlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ productId: product.id }),
        }
      );

      if (response.ok) {
        setIsWishlisted(true);
        toast.success("Added to wishlist");
        wishlistEvents.emit();
      } else toast.error("Failed to add to wishlist");
    } catch {
      toast.error("Failed to add to wishlist");
    }
  };

  return (
    <Link
      to={`/product/${(product.category || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(product.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      className="
    bg-white
    rounded-lg
    shadow-sm
    border
    overflow-hidden 
    w-full
    h-full
    block
    flex flex-col
  "
    >

      {/* Image (custom aspect) */}
      <div className={`relative w-full ${aspectRatio} overflow-hidden bg-gray-100`}>
        <ImageWithFallback
          src={optimizeImage(product.image, 480)}
          alt={product.name}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className={`${hideCategory ? 'p-3' : 'p-4'} flex flex-col justify-between`} style={{ minHeight: hideCategory ? 'auto' : '110px' }}>
        {!hideCategory && (
          <p className="text-sm text-gray-500 mb-1">{product.category}</p>
        )}

        <h3 className={`text-gray-900 mb-2 ${hideCategory ? 'text-sm font-medium' : ''}`}>{truncatedName}</h3>

        <div className="flex items-center justify-between">
          <span className="text-gray-900 font-semibold">
            ₹ {(overridePrice ?? product.price).toFixed(2)}
          </span>

          {!hideColors && product.colors?.length > 0 && (
            <div className="flex gap-1">
              {product.colors.slice(0, 3).map((color, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.toLowerCase() }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {!eyeNavigates && open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-[94vw] md:w-[720px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={optimizeImage(product.image, 480)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-500 mb-1">{product.category}</p>

                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {product.name}
                </h3>

                <p className="text-xl font-bold text-gray-900 mb-6">
                  ₹ {(overridePrice ?? product.price).toFixed(2)}
                </p>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/product/${(product.category || 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${(product.name || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    className="premium-btn-white"
                    onClick={() => setOpen(false)}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}

export const ProductCard = React.memo(ProductCardComponent);
