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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<ListingSummary[]>(() => {
    try {
      const saved = localStorage.getItem('rentora_cart');
      return saved ? JSON.parse(saved) : [];
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

  const isInWishlist = (id: string) => wishlist.some((item) => item._id === id);

  const toggleWishlist = (listing: ListingSummary) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item._id === listing._id);
      if (exists) {
        return prev.filter((item) => item._id !== listing._id);
      } else {
        return [...prev, listing];
      }
    });
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item._id !== id));
  };

  const clearWishlist = () => setWishlist([]);

  const isInCart = (id: string) => cart.some((item) => item._id === id);

  const addToCart = (listing: ListingSummary) => {
    setCart((prev) => {
      if (prev.some((item) => item._id === listing._id)) return prev;
      return [...prev, listing];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
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
