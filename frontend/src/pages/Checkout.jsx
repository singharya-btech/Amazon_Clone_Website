import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import { useCart } from "../context/CartContext";

const Checkout = () => {
  const { cartItems, clearCart, subtotal, discountAmount, finalTotal, coupon } = useCart();
  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!shipping.fullName || !shipping.address || !shipping.city || !shipping.postal) {
      alert("Please fill in all mandatory shipping address fields.");
      return;
    }

    const orderId = `ORD-V1-${Date.now()}`;
    const order = {
      id: orderId,
      date: new Date().toLocaleDateString(),
      items: cartItems,
      subtotal,
      discountAmount,
      couponCode: coupon?.code || null,
      total: finalTotal,
      shipping,
      paymentMethod,
      status: "Placed",
    };

    try {
      const stored = localStorage.getItem("orders");
      const orders = stored ? JSON.parse(stored) : [];
      orders.unshift(order);
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (err) {
      console.error("Failed to store order in local storage", err);
    }

    setOrderPlaced(true);
    clearCart();
    setTimeout(() => {
      navigate("/orders");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orderPlaced ? (
          <div className="bg-white rounded-lg shadow p-8 text-center max-w-md mx-auto my-12">
            <div className="text-5xl text-emerald-500 mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-4">Thank you for your order. Redirecting you to your orders page...</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Shipping & Payment Form */}
            <form onSubmit={handlePlaceOrder} className="lg:w-8/12 space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-4">
                  1. Delivery Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John Doe"
                      value={shipping.fullName}
                      onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={shipping.email}
                      onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={shipping.phone}
                      onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address *</label>
                    <input
                      required
                      type="text"
                      placeholder="Flat, House no., Building, Company, Apartment"
                      value={shipping.address}
                      onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                    <input
                      required
                      type="text"
                      placeholder="City"
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={shipping.state}
                      onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code *</label>
                    <input
                      required
                      type="text"
                      placeholder="Postal Code / PIN"
                      value={shipping.postal}
                      onChange={(e) => setShipping({ ...shipping, postal: e.target.value })}
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-4">
                  2. Select Payment Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">Cash on Delivery (COD)</span>
                      <p className="text-xs text-gray-500">Pay cash upon receiving your order.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">Credit / Debit Card (Simulated)</span>
                      <p className="text-xs text-gray-500">Visa, Mastercard, RuPay.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === "upi"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">UPI / QR Code</span>
                      <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm.</p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={cartItems.length === 0}
                className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-gray-200 text-gray-900 font-bold py-3.5 rounded shadow text-base transition"
              >
                Place Your Order (₹{finalTotal.toFixed(2)})
              </button>
            </form>

            {/* Order Summary Sidebar */}
            <div className="lg:w-4/12 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">
                  Order Summary
                </h3>

                <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto mb-4 pr-1">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.variantId || "base"}`} className="py-2 flex justify-between text-xs">
                      <div>
                        <div className="font-semibold text-gray-800 line-clamp-1">{item.name}</div>
                        {item.variantName && (
                          <div className="text-gray-500">Var: {item.variantName}</div>
                        )}
                        <div className="text-gray-400">Qty: {item.quantity} × ₹{item.price}</div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm border-t pt-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {coupon && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Promo Discount ({coupon.code}):</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Delivery:</span>
                    <span className="text-emerald-600 font-medium">FREE</span>
                  </div>

                  <div className="border-t pt-2 flex justify-between text-base font-bold text-gray-900">
                    <span>Order Total:</span>
                    <span className="text-amber-700">₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Checkout;
