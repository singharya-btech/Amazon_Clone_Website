import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import { getStorefrontProducts, getCategories, getSearchSuggestions } from "../mock/marketplace";

import "./Shop.css";

const Shop = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "All");
  const [storeProducts, setStoreProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setCategory(p.get("category") || "All");
    setSearch(p.get("search") || "");
  }, [location.search]);

  // Only products from verified sellers (plus any legacy/no-seller products)
  // reach the storefront — the backend already enforces this.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getStorefrontProducts(), getCategories()])
      .then(([products, cats]) => {
        if (cancelled) return;
        setStoreProducts(products);
        setCategories(["All", ...cats]);
      })
      .catch(() => {
        if (!cancelled) setStoreProducts([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = storeProducts.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  // When a search has no direct hits, offer related-category suggestions
  // instead of a flat "nothing found".
  useEffect(() => {
    let cancelled = false;
    if (search.trim() && filteredProducts.length === 0) {
      getSearchSuggestions(search).then((res) => {
        if (!cancelled) setSuggestions(res);
      });
    } else {
      setSuggestions(null);
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, storeProducts.length]);

  return (
    <>
      <Header />
      <Navbar />

      <div className="shop">

        <div className="shop__header">
          <h1>Shop</h1>

          <div className="shop__filters">

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
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

          </div>
        </div>

        <div className="shop__products">

          {loading ? (
            <h2>Loading products…</h2>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : suggestions && suggestions.related.length > 0 ? (
            <div className="shop__noMatch">
              <h2>No exact matches for "{search}"</h2>
              <p>You might like these from {suggestions.relatedCategory}:</p>
              <div className="shop__products">
                {suggestions.related.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            <h2>No products found.</h2>
          )}

        </div>

      </div>

      <Footer />
    </>
  );
};

export default Shop;