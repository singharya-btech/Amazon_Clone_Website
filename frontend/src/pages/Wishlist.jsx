import React from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  product1,
  product2,
  product3,
  product4,
} from "../assets";

import "./Wishlist.css";

const wishlistItems = [
  {
    id: 1,
    title: "Apple iPhone 15 Pro",
    image: product1,
    price: 999,
  },
  {
    id: 2,
    title: "Samsung Galaxy S24 Ultra",
    image: product2,
    price: 899,
  },
  {
    id: 3,
    title: "Sony WH-1000XM5 Headphones",
    image: product3,
    price: 349,
  },
  {
    id: 4,
    title: "MacBook Air M3",
    image: product4,
    price: 1299,
  },
];

const Wishlist = () => {
  return (
    <>
      <Header />
      <Navbar />

      <div className="wishlist">

        <h1>My Wishlist ❤️</h1>

        {wishlistItems.length === 0 ? (
          <div className="emptyWishlist">
            <h2>Your wishlist is empty.</h2>
          </div>
        ) : (
          <div className="wishlistGrid">

            {wishlistItems.map((item) => (
              <div className="wishlistCard" key={item.id}>

                <img
                  src={item.image}
                  alt={item.title}
                  className="wishlistImage"
                />

                <h3>{item.title}</h3>

                <p className="wishlistPrice">
                  ₹{item.price}
                </p>

                <div className="wishlistButtons">

                  <button className="cartBtn">
                    Add to Cart
                  </button>

                  <button className="removeBtn">
                    Remove
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      <Footer />
    </>
  );
};

export default Wishlist;