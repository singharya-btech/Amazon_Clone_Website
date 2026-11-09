import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Cart.css";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <>
      <Header />
      <Navbar />

      <div className="cart">

        <div className="cart__left">

          <h1>Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <h3>Your cart is empty.</h3>
          ) : (
            cartItems.map((item) => (
              <div className="cart__item" key={item.id}>

                <img
                  src={item.image}
                  alt={item.title}
                  className="cart__image"
                />

                <div className="cart__details">
                  <h3>{item.title}</h3>

                  <p className="cart__price">₹{item.price}</p>

                  <p>Quantity: {item.quantity}</p>

                  <button
                    className="removeBtn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>

              </div>
            ))
          )}

        </div>

        <div className="cart__right">

          <h2>Order Summary</h2>

          <hr />

          <p>
            Items:
            <span>{cartItems.length}</span>
          </p>

          <p>
            Subtotal:
            <span>₹{subtotal}</span>
          </p>

          <button
            className="checkoutBtn"
            onClick={() => navigate("/checkout")}
            disabled={cartItems.length === 0}
          >
            Proceed to Checkout
          </button>

        </div>

      </div>

      <Footer />
    </>
  );
};

export default Cart;