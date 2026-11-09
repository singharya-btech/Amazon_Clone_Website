import React, { createContext, useContext, useState, useEffect } from "react";
import { validateCoupon } from "../services/productService";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Guest Cart State stored in localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem("guest_cart");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Coupon simulation state
  const [coupon, setCoupon] = useState(() => {
    try {
      const stored = localStorage.getItem("active_coupon");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Recently Viewed Product IDs stored in localStorage
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("recently_viewed_ids");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist guest cart
  useEffect(() => {
    try {
      localStorage.setItem("guest_cart", JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  // Persist coupon
  useEffect(() => {
    try {
      if (coupon) {
        localStorage.setItem("active_coupon", JSON.stringify(coupon));
      } else {
        localStorage.removeItem("active_coupon");
      }
    } catch (e) {}
  }, [coupon]);

  // Persist recently viewed IDs
  useEffect(() => {
    try {
      localStorage.setItem("recently_viewed_ids", JSON.stringify(recentlyViewedIds));
    } catch (e) {}
  }, [recentlyViewedIds]);

  // Record viewed product ID (keeps last 10 unique IDs, latest first)
  const recordProductView = (productId) => {
    if (!productId) return;
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => String(id) !== String(productId));
      return [productId, ...filtered].slice(0, 10);
    });
  };

  // Add item with variant support
  const addToCart = (product, selectedVariant = null, quantity = 1) => {
    setCartItems((prev) => {
      const variantId = selectedVariant ? selectedVariant.id : null;
      const price = selectedVariant && selectedVariant.price_override
        ? selectedVariant.price_override
        : product.price;
      const sku = selectedVariant ? selectedVariant.sku : (product.sku || `PRD-${product.id}`);
      const variantName = selectedVariant ? selectedVariant.name : "";

      const existingIndex = prev.findIndex(
        (item) => String(item.id) === String(product.id) && item.variantId === variantId
      );

      if (existingIndex > -1) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          variantId,
          variantName,
          sku,
          name: product.name || product.title,
          price: Number(price),
          image: product.image,
          quantity,
          stock: selectedVariant ? selectedVariant.stock : product.stock,
        },
      ];
    });
  };

  // Update item quantity
  const updateQuantity = (id, quantity, variantId = null) => {
    if (quantity <= 0) {
      removeFromCart(id, variantId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        String(item.id) === String(id) && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Remove specific item (matching product + variant)
  const removeFromCart = (id, variantId = null) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(String(item.id) === String(id) && item.variantId === variantId)
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
  };

  // Calculations
  const subtotal = roundPrice(
    cartItems.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1), 0)
  );

  const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const discountAmount = coupon
    ? coupon.discount_type === "percent"
      ? roundPrice((subtotal * coupon.discount_value) / 100)
      : Math.min(coupon.discount_value, subtotal)
    : 0;

  const finalTotal = roundPrice(Math.max(0, subtotal - discountAmount));

  // Apply Coupon Simulation
  const applyCouponCode = async (code) => {
    if (!code || !code.trim()) return false;
    setCouponLoading(true);
    setCouponError("");
    try {
      const data = await validateCoupon(code.trim().toUpperCase(), subtotal);
      if (data.valid) {
        setCoupon(data);
        setCouponLoading(false);
        return { success: true, message: data.message };
      } else {
        setCouponError(data.error || "Invalid coupon code");
        setCouponLoading(false);
        return { success: false, message: data.error };
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid or expired coupon code.";
      setCouponError(msg);
      setCouponLoading(false);
      return { success: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError("");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        finalTotal,
        discountAmount,
        coupon,
        couponError,
        couponLoading,
        applyCouponCode,
        removeCoupon,
        recentlyViewedIds,
        recordProductView,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

function roundPrice(val) {
  return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
}
