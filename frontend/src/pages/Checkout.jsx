import React, { useState } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

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

  const subtotal = cartItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const id = `ORD${Date.now()}`;
    const date = new Date().toLocaleDateString();
    const total = subtotal;
    const status = "Processing";

    const order = {
      id,
      date,
      total,
      status,
      items: cartItems,
    };

    try {
      const stored = localStorage.getItem("orders");
      const orders = stored ? JSON.parse(stored) : [];
      orders.unshift(order);
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (e) {
      console.error("Failed to save order", e);
    }

    clearCart();
    navigate("/orders");
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
                defaultChecked
              />
              Cash on Delivery
            </label>

            <label>
              <input
                type="radio"
                name="payment"
              />
              Credit / Debit Card
            </label>

            <label>
              <input
                type="radio"
                name="payment"
              />
              UPI
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

          <button className="placeOrderBtn" onClick={handlePlaceOrder}>
            Place Order
          </button>

        </div>

      </div>

      <Footer />
    </>
  );
};

export default Checkout;