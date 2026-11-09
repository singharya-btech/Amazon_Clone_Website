import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { getProducts } from "../services/productService";

import {
  banner1,
  home,
  electronics,
  fashion,
  books,
  product1,
  product2,
  product3,
  product4,
  product5,
  product6,
} from "../assets";

import "./Home.css";

const seedProducts = [
  {
    id: 1,
    image: product1,
    title: "Men's T-Shirt",
    price: 999,
    rating: 5,
  },
  {
    id: 2,
    image: product2,
    title: "Men's Suit",
    price: 899,
    rating: 4,
  },
  {
    id: 3,
    image: product3,
    title: "Children's Toy",
    price: 349,
    rating: 5,
  },
  {
    id: 4,
    image: product4,
    title: "Toy Car",
    price: 1299,
    rating: 5,
  },
  {
    id: 5,
    image: product5,
    title: "Smart Phone",
    price: 199,
    rating: 4,
  },
  {
    id: 6,
    image: product6,
    title: "Phone",
    price: 59,
    rating: 4,
  },
];

const Home = () => {
  const [products, setProducts] = useState(seedProducts);

  // Fetch products from the backend so admin-added products are visible on the home page too.
  // Also fall back to localStorage so products added by an admin (stored there as a fallback)
  // are visible on the main page for every user — registered or not — even when the backend
  // is unreachable.
  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      // Read any admin-added products from localStorage (fallback for offline/demo mode)
      let storedProducts = [];
      try {
        const stored = localStorage.getItem("products");
        storedProducts = stored ? JSON.parse(stored) : [];
      } catch (e) {
        storedProducts = [];
      }

      let backendProducts = [];
      try {
        const data = await getProducts();
        backendProducts = data.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.name,
          price: p.price,
          rating: p.rating,
          image: p.image,
        }));
      } catch (err) {
        console.error("Unable to load products from backend:", err);
      }

      if (!active) return;

      // Merge: backend products (newest first) + localStorage products (admin-added) + seed products
      const merged = [...backendProducts, ...storedProducts, ...seedProducts];
      // Deduplicate by slug (or id/title as fallback)
      const seen = new Set();
      const unique = merged.filter((product) => {
        const key = product.slug || String(product.id) || product.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setProducts(unique);
    };
    loadProducts();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Header />
      <Navbar />

      <div className="home">

        <section className="heroBanner">
          <div className="heroBanner__content">
            <span>Deal of the Day</span>
            <h1>Shop the Latest Collections</h1>
            <p>
              Discover top products with great offers across fashion, electronics, home essentials and more.
            </p>
            <div className="heroBanners__actions">
              <button>Shop Now</button>
              <button className="secondary">Explore Categories</button>
            </div>
          </div>
          <div className="heroBanner__image">
            <img src={banner1} alt="Hero Banner" />
          </div>
        </section>

        <section className="categories">
          <div className="sectionHeader">
            <div>
              <h2>Shop by Category</h2>
              <p>Browse curated categories and find the perfect product.</p>
            </div>
          </div>

          <div className="categoryGrid">
            <div className="categoryCard">
              <img src={home} alt="Home" />
              <h3>Home</h3>
              <p>Essentials and decor</p>
            </div>
            <div className="categoryCard">
              <img src={electronics} alt="Electronics" />
              <h3>Electronics</h3>
              <p>Latest gadgets and devices</p>
            </div>
            <div className="categoryCard">
              <img src={fashion} alt="Fashion" />
              <h3>Fashion</h3>
              <p>Trending looks for all</p>
            </div>
            <div className="categoryCard">
              <img src={books} alt="Books" />
              <h3>Books</h3>
              <p>Best sellers and novels</p>
            </div>
          </div>
        </section>

        <section className="products">
          <div className="sectionHeader">
            <div>
              <h2>Popular Products</h2>
              <p>Handpicked items that customers love.</p>
            </div>
          </div>

          <div className="productGrid">
            {products.map((product) => (
              <ProductCard key={product.slug || product.id} product={product} />
            ))}
          </div>
        </section>

      </div>

      <Footer />
    </>
  );
};

export default Home;
