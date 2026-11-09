import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FaStar, FaHeart, FaRegHeart, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaShieldAlt, FaTruck } from "react-icons/fa";

import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductImageGallery from "../components/ProductImageGallery";
import ProductVariants from "../components/ProductVariants";
import RecentlyViewed from "../components/RecentlyViewed";
import MobileBottomNav from "../components/MobileBottomNav";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { getProductById } from "../services/productService";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart, recordProductView } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Variant selection
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setSelectedVariant(null);
    setQuantity(1);

    getProductById(id)
      .then((data) => {
        if (active) {
          setProduct(data);
          // Set default variant if available
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
          setLoading(false);
          // Record view in recently viewed products
          recordProductView(data.id);
        }
      })
      .catch((err) => {
        if (active) {
          setError("Failed to load product details.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <div>
          <Header />
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f08804] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <div>
          <Header />
          <Navbar />
          <div className="max-w-6xl mx-auto px-4 py-20 text-center">
            <p className="text-red-600 mb-4">{error || "Product not found."}</p>
            <Link to="/shop" className="text-sm font-semibold text-[#007185] hover:underline">
              ← Return to Catalog
            </Link>
          </div>
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  // Determine current active price, SKU, and availability
  const currentPrice = selectedVariant && selectedVariant.price_override !== null
    ? selectedVariant.price_override
    : product.price;

  const currentSku = selectedVariant ? selectedVariant.sku : (product.sku || `PRD-${product.id}`);

  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = activeStock <= 0;
  const isLowStock = activeStock > 0 && activeStock <= (product.low_stock_threshold || 5);

  const handleAddToCart = () => {
    addToCart(product, selectedVariant, quantity);
    setAddedMessage("Added to Cart!");
    setTimeout(() => setAddedMessage(""), 3000);
  };

  const isFavorited = isInWishlist(product.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between pb-16 md:pb-0">
      <div>
        <Header />
        <Navbar />

        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 py-2 text-xs text-gray-500">
          <Link to="/" className="hover:underline">Home</Link> &gt;{" "}
          <Link to="/shop" className="hover:underline">Storefront</Link> &gt;{" "}
          {product.category_name && (
            <>
              <Link to={`/shop?category=${product.category_name.toLowerCase()}`} className="hover:underline">
                {product.category_name}
              </Link> &gt;{" "}
            </>
          )}
          <span className="text-gray-800 font-medium truncate">{product.name}</span>
        </div>

        {/* Main Product Container */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left: Product Image Gallery (5 cols) */}
            <div className="md:col-span-5">
              <ProductImageGallery
                mainImage={product.image}
                galleryImages={product.gallery_images}
                title={product.name}
              />
            </div>

            {/* Middle: Product Info (4 cols) */}
            <div className="md:col-span-4 flex flex-col justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>

                {product.brand && (
                  <p className="text-xs text-gray-500 mt-1">
                    Brand: <span className="text-[#007185] font-semibold">{product.brand}</span>
                  </p>
                )}

                {/* Rating & Reviews */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-amber-500 text-sm">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={i < Math.floor(product.rating || 0) ? "text-amber-400" : "text-gray-200"}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{product.rating || "4.5"}</span>
                  <span className="text-xs text-gray-400">({product.num_reviews || 0} customer ratings)</span>
                </div>

                <div className="border-t border-b border-gray-200 my-4 py-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-gray-900">
                      ${Number(currentPrice).toFixed(2)}
                    </span>
                    {product.compare_price && product.compare_price > currentPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        ${Number(product.compare_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Inclusive of all local taxes</p>
                </div>

                {/* SKU Badge */}
                <div className="flex items-center gap-2 text-xs mb-3">
                  <span className="text-gray-500">Item SKU:</span>
                  <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                    {currentSku}
                  </span>
                </div>

                {/* Variants Selector */}
                <ProductVariants
                  variants={product.variants}
                  selectedVariant={selectedVariant}
                  onSelectVariant={(v) => setSelectedVariant(v)}
                />

                {/* Description */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">About this item</h3>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description || "Premium quality e-commerce product guaranteed."}
                  </p>
                </div>

                {/* Specifications */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Technical Specifications</h3>
                    <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      {Object.entries(product.specifications).map(([key, val]) => (
                        <React.Fragment key={key}>
                          <dt className="text-gray-500 font-medium">{key}</dt>
                          <dd className="text-gray-800 font-mono">{String(val)}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Buy Box / Action Panel (3 cols) */}
            <div className="md:col-span-3">
              <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-xs">
                <div className="text-xl font-bold text-gray-900 mb-2">
                  ${Number(currentPrice).toFixed(2)}
                </div>

                {/* Availability Badge */}
                <div className="mb-4">
                  {isOutOfStock ? (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                      <FaTimesCircle /> Currently Out of Stock
                    </div>
                  ) : isLowStock ? (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                      <FaExclamationTriangle /> Only {activeStock} left in stock - order soon
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                      <FaCheckCircle /> In Stock ({activeStock} available)
                    </div>
                  )}
                </div>

                {/* Quantity selector */}
                {!isOutOfStock && (
                  <div className="mb-4 flex items-center justify-between text-xs">
                    <label htmlFor="qty" className="font-semibold text-gray-700">Quantity:</label>
                    <select
                      id="qty"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#f08804]"
                    >
                      {[...Array(Math.min(10, activeStock))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="w-full py-2 bg-[#ffd814] hover:bg-[#f7ca00] text-[#0f1111] font-medium text-xs rounded-full border border-[#fcd200] shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart (Guest / Direct)
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs rounded-full border border-gray-300 transition flex items-center justify-center gap-2"
                  >
                    {isFavorited ? (
                      <>
                        <FaHeart className="text-red-500" /> In Wishlist
                      </>
                    ) : (
                      <>
                        <FaRegHeart /> Add to Wishlist
                      </>
                    )}
                  </button>
                </div>

                {addedMessage && (
                  <p className="mt-2 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 py-1 rounded">
                    {addedMessage}
                  </p>
                )}

                {/* Trust Badges */}
                <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-2">
                    <FaTruck className="text-gray-400" />
                    <span>Free Standard Shipping on eligible orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaShieldAlt className="text-gray-400" />
                    <span>Secure simulated checkout guaranteed</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Recently Viewed Carousel */}
          <RecentlyViewed currentProductId={product.id} />
        </div>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ProductDetail;
