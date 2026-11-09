import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import CouponBox from "../components/CouponBox";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    discountAmount,
    finalTotal,
    coupon,
  } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items Column */}
          <div className="lg:w-8/12">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-800 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🛒</div>
                  <h2 className="text-xl font-medium text-gray-700 mb-2">Your Amazon Cart is empty</h2>
                  <p className="text-gray-500 mb-6">Explore today's featured products and special deals.</p>
                  <Link
                    to="/shop"
                    className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-6 py-2 rounded-md shadow-sm transition"
                  >
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.id}-${item.variantId || "base"}`}
                      className="py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                    >
                      {/* Product Image */}
                      <Link to={`/product/${item.id}`} className="shrink-0">
                        <img
                          src={item.image || "https://placehold.co/120x120?text=No+Image"}
                          alt={item.name}
                          className="w-24 h-24 object-contain rounded border p-1"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.id}`}
                          className="text-base font-semibold text-gray-800 hover:text-amber-700 line-clamp-2"
                        >
                          {item.name}
                        </Link>

                        {/* Variant Info */}
                        {item.variantName && (
                          <div className="mt-1 text-xs font-medium text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded">
                            Variant: {item.variantName}
                          </div>
                        )}

                        {/* SKU */}
                        <div className="text-xs text-gray-400 mt-1">
                          SKU: <span className="font-mono">{item.sku || `PRD-${item.id}`}</span>
                        </div>

                        {/* In Stock Badge */}
                        <div className="text-xs text-emerald-600 font-medium mt-1">
                          In Stock (Available: {item.stock ?? "99+"})
                        </div>

                        {/* Quantity and Actions */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, (item.quantity || 1) - 1, item.variantId)
                              }
                              className="px-3 py-1 hover:bg-gray-100 text-gray-700 font-bold"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => {
                                const maxStock = item.stock || 99;
                                if ((item.quantity || 1) < maxStock) {
                                  updateQuantity(item.id, (item.quantity || 1) + 1, item.variantId);
                                }
                              }}
                              className="px-3 py-1 hover:bg-gray-100 text-gray-700 font-bold"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id, item.variantId)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right sm:w-28">
                        <div className="text-lg font-bold text-gray-900">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ₹{Number(item.price).toFixed(2)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:w-4/12 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items):</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                </div>

                {coupon && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon ({coupon.code}):</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Estimated Delivery:</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-base font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span className="text-amber-700">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                disabled={cartItems.length === 0}
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-900 font-bold py-3 rounded-md shadow transition"
              >
                Proceed to Buy
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                🔒 Safe & Secure Checkout with 100% Purchase Protection
              </div>
            </div>

            {/* Simulated Coupon Component */}
            <CouponBox />
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Cart;
