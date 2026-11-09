import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { placeOrder, validateCoupon } from "../services/orderService";
import { getAddresses } from "../services/authService";

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, user, profile } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [loading, setLoading] = useState(false);

  const subtotal = cartItems.reduce(
    (s, i) => s + (Number(i.price || i.product_price || 0)) * (i.quantity || 1),
    0
  );

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    if (isAuthenticated) {
      getAddresses().then((addrs) => {
        setSavedAddresses(addrs || []);
        const defaultAddr = addrs?.find((a) => a.is_default) || addrs?.[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          applyAddress(defaultAddr);
        } else if (profile || user) {
          setShipping((prev) => ({
            ...prev,
            fullName: `${profile?.first_name || user?.first_name || ""} ${profile?.last_name || user?.last_name || ""}`.trim() || user?.username || "",
            email: profile?.email || user?.email || "",
            phone: profile?.phone || "",
          }));
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, profile, user]);

  const applyAddress = (addr) => {
    setShipping({
      fullName: addr.full_name,
      email: profile?.email || user?.email || "",
      phone: addr.phone,
      address: addr.street_address,
      city: addr.city,
      state: addr.state,
      postal: addr.postal_code,
    });
  };

  const handleCouponApply = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const data = await validateCoupon(couponCode.trim().toUpperCase(), subtotal);
      if (data.valid) {
        setAppliedCoupon(data);
      } else {
        setCouponError(data.error || "Invalid coupon");
      }
    } catch (err) {
      setCouponError(err.response?.data?.error || "Invalid or expired coupon code.");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!shipping.fullName || !shipping.address || !shipping.city || !shipping.postal) {
      alert("Please fill in all mandatory address fields.");
      return;
    }

    setLoading(true);
    const orderPayload = {
      full_name: shipping.fullName,
      email: shipping.email || "customer@example.com",
      phone: shipping.phone || "",
      address: shipping.address,
      city: shipping.city,
      state: shipping.state || "State",
      zip_code: shipping.postal,
      payment_method: paymentMethod,
      coupon_code: appliedCoupon ? appliedCoupon.code : "",
    };

    try {
      if (isAuthenticated) {
        const createdOrder = await placeOrder(orderPayload);
        clearCart();
        navigate("/orders");
      } else {
        // Fallback for guest
        const id = `ORD-V2-${Date.now()}`;
        const order = {
          id,
          date: new Date().toLocaleDateString(),
          total: finalTotal,
          status: "Pending",
          items: cartItems,
          shipping,
          paymentMethod,
        };
        const stored = localStorage.getItem("orders");
        const orders = stored ? JSON.parse(stored) : [];
        orders.unshift(order);
        localStorage.setItem("orders", JSON.stringify(orders));
        clearCart();
        navigate("/orders");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 border-b pb-4 mb-6">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Address & Payment */}
          <div className="lg:w-8/12 space-y-6">
            {/* Saved Addresses Selector */}
            {savedAddresses.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">1. Select Delivery Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        applyAddress(addr);
                      }}
                      className={`border rounded-lg p-3 cursor-pointer transition ${
                        selectedAddressId === addr.id ? "border-amber-500 bg-amber-50/30 ring-1 ring-amber-500" : "hover:border-gray-400"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs mb-1 font-bold">
                        <span className="uppercase text-gray-700">{addr.address_type}</span>
                        {addr.is_default && <span className="text-amber-700">Default</span>}
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">{addr.full_name}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{addr.street_address}</p>
                      <p className="text-xs text-gray-500">{addr.city}, {addr.postal_code}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Address Details Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {savedAddresses.length > 0 ? "Or Enter / Edit Shipping Address" : "1. Shipping Address"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={shipping.fullName}
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={shipping.email}
                    onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    value={shipping.phone}
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address *</label>
                  <input
                    required
                    type="text"
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                  <input
                    required
                    type="text"
                    value={shipping.city}
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code *</label>
                  <input
                    required
                    type="text"
                    value={shipping.postal}
                    onChange={(e) => setShipping({ ...shipping, postal: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
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
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <span className="font-semibold text-gray-800 text-sm">Credit / Debit Card</span>
                    <p className="text-xs text-gray-500">Visa, Mastercard, RuPay.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary & Coupon */}
          <div className="lg:w-4/12 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({appliedCoupon.code}):</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Delivery:</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-base font-bold text-gray-900">
                  <span>Total Amount:</span>
                  <span className="text-amber-700">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading || cartItems.length === 0}
                className="w-full mt-6 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 rounded shadow text-sm transition"
              >
                {loading ? "Placing Order..." : `Place Your Order (₹${finalTotal.toFixed(2)})`}
              </button>
            </div>

            {/* Coupon Code Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Apply Promo Code</h4>
              <form onSubmit={handleCouponApply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAVE20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-xs uppercase"
                />
                <button
                  type="submit"
                  className="bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs px-4 py-2 rounded transition"
                >
                  Apply
                </button>
              </form>
              {appliedCoupon && (
                <p className="text-xs text-emerald-600 font-semibold mt-2">
                  ✓ {appliedCoupon.message}
                </p>
              )}
              {couponError && (
                <p className="text-xs text-red-600 font-semibold mt-2">{couponError}</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
