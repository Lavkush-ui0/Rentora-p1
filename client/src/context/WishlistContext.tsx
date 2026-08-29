import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ListingSummary {
  _id: string;
  title: string;
  images: string[];
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  rentalPrice: number;
  priceUnit: 'DAY' | 'WEEK' | 'MONTH';
  securityDeposit: number;
  owner: {
    _id: string;
    fullName: string;
    avatar: string;
    ratingAverage?: number;
  };
}

interface WishlistContextType {
  wishlist: ListingSummary[];
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (listing: ListingSummary) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  wishlistCount: number;

  cart: ListingSummary[];
  isInCart: (id: string) => boolean;
  addToCart: (listing: ListingSummary) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<ListingSummary[]>(() => {
    try {
      const saved = localStorage.getItem('rentora_wishlist');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((item) => item && (item._id || (item as any).id)) : [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<ListingSummary[]>(() => {
    try {
      const saved = localStorage.getItem('rentora_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((item) => item && (item._id || (item as any).id)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rentora_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist:', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('rentora_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart:', e);
    }
  }, [cart]);

  const isInWishlist = (id: string) => {
    if (!id) return false;
    return wishlist.some((item) => item && (item._id === id || (item as any).id === id));
  };

  const toggleWishlist = (listing: ListingSummary) => {
    if (!listing) return;
    const itemId = listing._id || (listing as any).id;
    if (!itemId) return;

    setWishlist((prev) => {
      const exists = prev.some((item) => item && (item._id === itemId || (item as any).id === itemId));
      if (exists) {
        return prev.filter((item) => item && (item._id !== itemId && (item as any).id !== itemId));
      } else {
        const cleanListing: ListingSummary = {
          _id: itemId,
          title: listing.title || 'Product',
          images: Array.isArray(listing.images) ? listing.images : [],
          condition: listing.condition || 'GOOD',
          rentalPrice: Number(listing.rentalPrice) || 0,
          priceUnit: listing.priceUnit || 'DAY',
          securityDeposit: Number(listing.securityDeposit) || 0,
          owner: {
            _id: listing.owner?._id || (listing.owner as any)?.id || '',
            fullName: listing.owner?.fullName || 'Student',
            avatar: listing.owner?.avatar || '',
            ratingAverage: Number(listing.owner?.ratingAverage) || 5,
          },
        };
        return [...prev, cleanListing];
      }
    });
  };

  const removeFromWishlist = (id: string) => {
    if (!id) return;
    setWishlist((prev) => prev.filter((item) => item && item._id !== id && (item as any).id !== id));
  };

  const clearWishlist = () => setWishlist([]);

  const isInCart = (id: string) => {
    if (!id) return false;
    return cart.some((item) => item && (item._id === id || (item as any).id === id));
  };

  const addToCart = (listing: ListingSummary) => {
    if (!listing) return;
    const itemId = listing._id || (listing as any).id;
    if (!itemId) return;

    setCart((prev) => {
      if (prev.some((item) => item && (item._id === itemId || (item as any).id === itemId))) return prev;
      const cleanListing: ListingSummary = {
        _id: itemId,
        title: listing.title || 'Product',
        images: Array.isArray(listing.images) ? listing.images : [],
        condition: listing.condition || 'GOOD',
        rentalPrice: Number(listing.rentalPrice) || 0,
        priceUnit: listing.priceUnit || 'DAY',
        securityDeposit: Number(listing.securityDeposit) || 0,
        owner: {
          _id: listing.owner?._id || (listing.owner as any)?.id || '',
          fullName: listing.owner?.fullName || 'Student',
          avatar: listing.owner?.avatar || '',
          ratingAverage: Number(listing.owner?.ratingAverage) || 5,
        },
      };
      return [...prev, cleanListing];
    });
  };

  const removeFromCart = (id: string) => {
    if (!id) return;
    setCart((prev) => prev.filter((item) => item && item._id !== id && (item as any).id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,

        cart,
        isInCart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount: cart.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;
