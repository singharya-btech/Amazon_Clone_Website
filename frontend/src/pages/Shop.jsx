import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { getProducts } from "../services/productService";

import {
  product1,
  product2,
  product3,
  product4,
  product5,
  product6,
} from "../assets";

import "./Shop.css";

const allProducts = [
  {
    id: 1,
    image: product1,
    title: "Men's T-Shirt",
    price: 999,
    rating: 5,
    category: "Fashion",
    brand: "Gucci",
  },
  {
    id: 2,
    image: product2,
    title: "Men's Suit",
    price: 899,
    rating: 4,
    category: "Fashion",
    brand: "Gucci",
  },
  {
    id: 3,
    image: product3,
    title: "Toy Car",
    price: 349,
    rating: 5,
    category: "Electronics",
    brand: "Sony",
  },
  {
    id: 4,
    image: product4,
    title: "Toys for Children",
    price: 1299,
    rating: 5,
    category: "Accessories",
    brand: "Logitech",
  },
  {
    id: 5,
    image: product5,
    title: "Smart Phone",
    price: 9999,
    rating: 4,
    category: "Electronics",
    brand: "Sumsung",
  },
  {
    id: 6,
    image: product6,
    title: "Phone",
    price: 19999,
    rating: 4,
    category: "Electronics",
    brand: "Apple",
  },
];

const Shop = () => {
  const [search, setSearch] = useState("");
  // Read category from URL query param if present
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialCategory = params.get("category") || "All";
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [backendProducts, setBackendProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    // update category when URL changes
    const p = new URLSearchParams(location.search).get("category") || "All";
    setCategory(p);
  }, [location.search]);

  // Fetch products from the backend so that products added by an admin
  // (stored in the shared MongoDB database) are visible to every user.
  useEffect(() => {
    let active = true;
    const loadBackendProducts = async () => {
      try {
        const data = await getProducts();
        const mapped = data.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.name,
          price: p.price,
          rating: p.rating,
          category: p.category_name || p.category,
          brand: p.brand,
          image: p.image,
          description: p.description,
          num_reviews: p.num_reviews,
          owner: p.owner_username,
        }));
        if (active) setBackendProducts(mapped);
      } catch (err) {
        console.error("Unable to load products from backend:", err);
        if (active) setBackendProducts([]);
      } finally {
        if (active) setProductsLoading(false);
      }
    };
    loadBackendProducts();
    return () => {
      active = false;
    };
  }, []);

  // Read any admin-added products from localStorage (fallback for offline/demo mode)
  let storedProducts = [];
  try {
    const stored = localStorage.getItem("products");
    storedProducts = stored ? JSON.parse(stored) : [];
  } catch (e) {
    storedProducts = [];
  }

  // Merge: backend products (shared) + localStorage products (fallback) + hardcoded seed products
  const merged = [...backendProducts, ...storedProducts, ...allProducts];

  // Deduplicate by slug (or id/title as fallback) to avoid showing the same product twice
  const seen = new Set();
  const uniqueMerged = merged.filter((product) => {
    const key = product.slug || String(product.id) || product.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const categories = ["All", ...new Set(uniqueMerged.map((product) => product.category).filter(Boolean))];
  const brands = ["All", ...new Set(uniqueMerged.map((product) => product.brand).filter(Boolean))];

  const filteredProducts = uniqueMerged.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;
    const matchesBrand = brand === "All" || product.brand === brand;
    const matchesMinPrice = minPrice === "" || Number(product.price) >= Number(minPrice);
    const matchesMaxPrice = maxPrice === "" || Number(product.price) <= Number(maxPrice);

    return matchesSearch && matchesCategory && matchesBrand && matchesMinPrice && matchesMaxPrice;
  });

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setBrand("All");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <>
      <Header />
      <Navbar />

      <div className="shop">

        <div className="shop__header">
          <h1>Shop</h1>

          <div className="shop__filters" aria-label="Product filters">

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Filter by brand">
              {brands.map((item) => <option key={item} value={item}>{item === "All" ? "All brands" : item}</option>)}
            </select>

            <div className="shop__price-range">
              <input type="number" min="0" placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} aria-label="Minimum price" />
              <span>to</span>
              <input type="number" min="0" placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} aria-label="Maximum price" />
            </div>

            <button type="button" className="shop__clear-filters" onClick={clearFilters}>Clear filters</button>

          </div>
        </div>

        <div className="shop__products">

          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.slug || product.id} product={product} />
            ))
          ) : (
            <h2 className="shop__empty">No products found for these filters.</h2>
          )}

          {productsLoading && (
            <p className="shop__loading">Loading more products…</p>
          )}

        </div>

      </div>

      <Footer />
    </>
  );
};

export default Shop;
