import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FrequentlyBoughtTogether from "../components/FrequentlyBoughtTogether";
import ProductQASection from "../components/ProductQASection";
import AdvancedReviewSection from "../components/AdvancedReviewSection";
import ProductComparisonModal from "../components/ProductComparisonModal";
import { useCart } from "../context/CartContext";
import {
  getProductById,
  getRecommendations,
  subscribeBackInStock,
} from "../services/productService";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Back in stock notification state
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    getProductById(id)
      .then((data) => {
        setProduct(data);
        if (data.id) {
          getRecommendations(data.id)
            .then((recs) => setRecommendations(recs || []))
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("Could not load product", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleSubscribeStock = async (e) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyLoading(true);
    try {
      const res = await subscribeBackInStock(product.id, notifyEmail.trim());
      setNotifyMsg(res.message || "Subscribed successfully!");
      setNotifyEmail("");
    } catch (e) {
      setNotifyMsg("Could not register notification.");
    } finally {
      setNotifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 font-semibold">Loading product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-500 mb-6">The item you are looking for may have been removed or discontinued.</p>
          <Link to="/shop" className="bg-amber-400 font-bold px-6 py-2 rounded text-sm text-gray-900 shadow">
            Browse All Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isOutOfStock = (product.stock ?? 0) <= 0;
  const compareListIds = [product.id, ...recommendations.slice(0, 3).map((r) => r.id)];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-2">
          <Link to="/" className="hover:underline">Home</Link>
          <span>&gt;</span>
          <Link to="/shop" className="hover:underline">Shop</Link>
          {product.category_name && (
            <>
              <span>&gt;</span>
              <span className="text-gray-700 font-medium">{product.category_name}</span>
            </>
          )}
        </div>

        {/* Product Hero Grid */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Column 1: Image Gallery */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full aspect-square max-w-sm rounded border p-4 flex items-center justify-center overflow-hidden">
              <img
                src={product.image || "https://placehold.co/400x400?text=Product"}
                alt={product.name}
                className="w-full h-full object-contain hover:scale-105 transition"
              />
            </div>

            {/* Sub-images thumbnails */}
            {(product.image_2 || product.image_3) && (
              <div className="flex gap-2 mt-4">
                <img src={product.image} alt="Thumbnail 1" className="w-14 h-14 border p-1 rounded object-contain" />
                {product.image_2 && <img src={product.image_2} alt="Thumbnail 2" className="w-14 h-14 border p-1 rounded object-contain" />}
                {product.image_3 && <img src={product.image_3} alt="Thumbnail 3" className="w-14 h-14 border p-1 rounded object-contain" />}
              </div>
            )}
          </div>

          {/* Column 2: Details & Specs */}
          <div className="md:col-span-4 space-y-4">
            {product.brand && (
              <span className="text-xs uppercase tracking-wider text-amber-700 font-bold">
                Brand: {product.brand}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* Ratings and Reviews */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-amber-500 font-bold flex items-center gap-1">
                ★ {product.rating || "4.5"}
              </span>
              <span className="text-blue-600 hover:underline cursor-pointer">
                {product.num_reviews || 1} ratings
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 font-mono text-[11px]">
                SKU: {product.sku || `SKU-${product.id}`}
              </span>
            </div>

            <hr />

            {/* Price section */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-red-700">₹{product.price}</span>
                {product.compare_price && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{product.compare_price}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-700 leading-relaxed">
              {product.description || "Premium quality product with authentic manufacturer warranty and reliable performance."}
            </p>

            {/* Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="border rounded p-3 bg-gray-50 text-xs">
                <h4 className="font-bold text-gray-800 mb-2">Technical Specifications</h4>
                <div className="divide-y divide-gray-200">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="py-1 flex justify-between">
                      <span className="text-gray-500">{key}:</span>
                      <span className="font-semibold text-gray-800">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compare Button */}
            <button
              onClick={() => setIsCompareOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
            >
              <span>⚖️</span> Compare with similar products
            </button>
          </div>

          {/* Column 3: Buy Box */}
          <div className="md:col-span-3">
            <div className="border border-gray-300 rounded-lg p-5 bg-white space-y-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">₹{product.price}</div>

              <div className="text-xs text-gray-600">
                <span>Delivery: </span>
                <span className="font-bold text-emerald-600">FREE within 2 Days</span>
              </div>

              {isOutOfStock ? (
                <div>
                  <div className="text-sm font-bold text-red-600 mb-3">Currently unavailable.</div>
                  <p className="text-xs text-gray-500 mb-2">
                    We don't know when this item will be back in stock. Enter your email to receive an alert:
                  </p>
                  <form onSubmit={handleSubscribeStock} className="space-y-2">
                    <input
                      required
                      type="email"
                      placeholder="your@email.com"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      className="w-full border rounded px-2.5 py-1.5 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={notifyLoading}
                      className="w-full bg-amber-400 hover:bg-amber-500 font-bold py-1.5 text-xs rounded shadow"
                    >
                      {notifyLoading ? "Subscribing..." : "Notify When in Stock"}
                    </button>
                    {notifyMsg && (
                      <p className="text-[11px] text-emerald-700 font-semibold">{notifyMsg}</p>
                    )}
                  </form>
                </div>
              ) : (
                <>
                  <div className="text-sm font-bold text-emerald-600">
                    In Stock ({product.stock} available)
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <label className="font-semibold text-gray-700">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="border rounded px-2 py-1 bg-gray-50"
                    >
                      {[1, 2, 3, 4, 5].map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className={`w-full py-2.5 rounded font-bold text-xs shadow transition ${
                      added ? "bg-emerald-600 text-white" : "bg-amber-400 hover:bg-amber-500 text-gray-900"
                    }`}
                  >
                    {added ? "✓ Added to Cart!" : "Add to Cart"}
                  </button>

                  <Link
                    to="/cart"
                    className="block text-center w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded shadow transition"
                  >
                    Buy Now
                  </Link>
                </>
              )}

              <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t">
                <div>Ships from: <span className="font-semibold text-gray-700">AmazonClone Fulfillment</span></div>
                <div>Sold by: <span className="font-semibold text-gray-700">Official Retailer</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together Bundle */}
        <FrequentlyBoughtTogether productId={product.id} />

        {/* Recommended Products Carousel / Grid */}
        {recommendations.length > 0 && (
          <div className="my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Customers who viewed this item also viewed
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  to={`/product/${rec.slug || rec.id}`}
                  className="bg-white border rounded-lg p-3 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={rec.image || "https://placehold.co/120x120?text=Product"}
                      alt={rec.name}
                      className="w-full aspect-square object-contain mb-2"
                    />
                    <h4 className="text-xs font-semibold text-gray-800 line-clamp-2">{rec.name}</h4>
                  </div>
                  <div className="mt-2 text-xs font-extrabold text-amber-700">₹{rec.price}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Customer Questions & Answers */}
        <ProductQASection productId={product.id} />

        {/* Advanced Customer Reviews with Image Attachments & Voting */}
        <AdvancedReviewSection
          productId={product.id}
          averageRating={product.rating}
          totalReviews={product.num_reviews}
        />

        {/* Product Comparison Modal */}
        <ProductComparisonModal
          productIds={compareListIds}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
        />
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
