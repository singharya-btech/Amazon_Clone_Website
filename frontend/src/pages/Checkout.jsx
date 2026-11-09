import React, { useState } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../services/orderService";

import "./Checkout.css";

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
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
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const subtotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const requiredFields = ["fullName", "email", "phone", "address", "city", "state", "postal"];
    const missing = requiredFields.filter((f) => !shipping[f].trim());
    if (missing.length > 0) {
      alert("Please fill in your full shipping address before placing the order.");
      return;
    }

    if (paymentMethod !== "cod") {
      alert("Only Cash on Delivery is available right now — card/UPI payment isn't wired up yet.");
      return;
    }

    setPlaceError("");
    setPlacing(true);
    try {
      const order = await placeOrder({
        full_name: shipping.fullName,
        email: shipping.email,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        zip_code: shipping.postal,
        country: "India",
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity || 1,
        })),
      });

      clearCart();
      navigate("/orders", { state: { justPlaced: true, orderId: order.id } });
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        "Could not place your order. Please try again.";
      setPlaceError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <Header />
      <Navbar />

      <div className="checkout">

        {/* Left Section */}
        <div className="checkout__left">

          <h1>Checkout</h1>

          {/* Shipping Address */}
          <div className="checkout__section">

            <h2>Shipping Address</h2>

            <input
              type="text"
              placeholder="Full Name"
              value={shipping.fullName}
              onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
            />

            <input
              type="email"
              placeholder="Email"
              value={shipping.email}
              onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={shipping.phone}
              onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
            />

            <input
              type="text"
              placeholder="Street Address"
              value={shipping.address}
              onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
            />

            <input
              type="text"
              placeholder="City"
              value={shipping.city}
              onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
            />

            <input
              type="text"
              placeholder="State"
              value={shipping.state}
              onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
            />

            <input
              type="text"
              placeholder="Postal Code"
              value={shipping.postal}
              onChange={(e) => setShipping({ ...shipping, postal: e.target.value })}
            />

          </div>

          {/* Payment */}
          <div className="checkout__section">

            <h2>Payment Method</h2>

            <label>
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              Cash on Delivery
            </label>

            <label style={{ opacity: 0.5 }}>
              <input
                type="radio"
                name="payment"
                disabled
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />
              Credit / Debit Card (coming soon)
            </label>

            <label style={{ opacity: 0.5 }}>
              <input
                type="radio"
                name="payment"
                disabled
                checked={paymentMethod === "upi"}
                onChange={() => setPaymentMethod("upi")}
              />
              UPI (coming soon)
            </label>

          </div>

        </div>

        {/* Right Section */}
        <div className="checkout__right">

          <h2>Order Summary</h2>

          <hr />

          <div className="summary__row">
            <span>Items</span>
            <span>{cartItems.reduce((s, i) => s + (i.quantity || 1), 0)}</span>
          </div>

          <div className="summary__row">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="summary__row">
            <span>Shipping</span>
            <span>FREE</span>
          </div>

          <div className="summary__row total">
            <span>Total</span>
            <span>₹{subtotal}</span>
          </div>

          {placeError && (
            <p style={{ color: "crimson", marginTop: 8 }}>{placeError}</p>
          )}

          <button className="placeOrderBtn" onClick={handlePlaceOrder} disabled={placing}>
            {placing ? "Placing Order…" : "Place Order"}
          </button>

        </div>

      </div>

      <Footer />
    </>
  );
};

export default Checkout;