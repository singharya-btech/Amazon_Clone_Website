import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import RecentlyViewed from "../components/RecentlyViewed";
import { getProducts } from "../services/productService";
import { FaFilter, FaStar, FaTimes } from "react-icons/fa";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 1,
    current_page: 1,
  });

  // Filter & Sort States
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [availability, setAvailability] = useState(searchParams.get("availability") || "");
  const [minRating, setMinRating] = useState(searchParams.get("min_rating") || "");
  const [ordering, setOrdering] = useState(searchParams.get("sort") || "newest");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const currentPage = Number(searchParams.get("page") || 1);
  const searchQuery = searchParams.get("search") || "";

  // Categories list
  const categories = [
    { label: "All Categories", slug: "" },
    { label: "Electronics", slug: "electronics" },
    { label: "Computers & Accessories", slug: "computers" },
    { label: "Home & Kitchen", slug: "home-kitchen" },
  ];

  // Fetch products whenever params change
  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = {
      page: currentPage,
      page_size: 12,
      ordering,
    };

    if (selectedCategory) params.category = selectedCategory;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (availability) params.availability = availability;
    if (minRating) params.min_rating = minRating;
    if (searchQuery) params.search = searchQuery;

    getProducts(params)
      .then((data) => {
        if (!active) return;
        if (data.results) {
          setProducts(data.results);
          setPagination({
            count: data.count,
            total_pages: data.total_pages || 1,
            current_page: data.current_page || 1,
          });
        } else if (Array.isArray(data)) {
          setProducts(data);
          setPagination({ count: data.length, total_pages: 1, current_page: 1 });
        }
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to load products:", err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedCategory, minPrice, maxPrice, availability, minRating, ordering, currentPage, searchQuery]);

  const handlePageChange = (newPage) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", newPage);
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setAvailability("");
    setMinRating("");
    setOrdering("newest");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between pb-16 md:pb-0">
      <div>
        <Header />
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Header Bar with Count and Sort Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {selectedCategory ? `${selectedCategory.toUpperCase()} Catalog` : "Storefront Catalog"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Showing {products.length} of {pagination.count} products
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-gray-700"
              >
                <FaFilter /> Filters
              </button>

              {/* Sorting Selector */}
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="sort-select" className="text-gray-600 font-medium whitespace-nowrap">Sort by:</label>
                <select
                  id="sort-select"
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f08804]"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Avg. Customer Review</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            
            {/* Sidebar Filters Desktop */}
            <aside className={`md:block col-span-1 ${mobileFilterOpen ? "block fixed inset-0 z-50 bg-white p-6 overflow-y-auto" : "hidden"}`}>
              <div className="flex items-center justify-between md:hidden mb-4 pb-2 border-b">
                <h3 className="font-bold text-base text-gray-800">Filter Products</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="text-gray-500 p-1">
                  <FaTimes className="text-lg" />
                </button>
              </div>

              <div className="space-y-6 text-xs text-gray-800">
                {/* Category Filter */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">Category</h4>
                  <ul className="space-y-1.5">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <button
                          onClick={() => setSelectedCategory(c.slug)}
                          className={`text-left w-full hover:text-[#f08804] ${
                            selectedCategory === c.slug ? "font-bold text-[#c45500]" : "text-gray-600"
                          }`}
                        >
                          {c.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price Range Filter */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">Price Range ($)</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                {/* Availability Filter */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">Availability</h4>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input
                        type="radio"
                        name="availability"
                        value=""
                        checked={availability === ""}
                        onChange={() => setAvailability("")}
                        className="text-[#f08804]"
                      />
                      <span>All Products</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input
                        type="radio"
                        name="availability"
                        value="in_stock"
                        checked={availability === "in_stock"}
                        onChange={() => setAvailability("in_stock")}
                        className="text-[#f08804]"
                      />
                      <span>In Stock Only</span>
                    </label>
                  </div>
                </div>

                {/* Customer Review Filter */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-bold text-gray-900 mb-2 uppercase tracking-wide">Customer Reviews</h4>
                  <div className="space-y-1.5">
                    {[4, 3].map((stars) => (
                      <button
                        key={stars}
                        onClick={() => setMinRating(minRating === String(stars) ? "" : String(stars))}
                        className={`flex items-center gap-1.5 w-full hover:text-[#c45500] ${
                          minRating === String(stars) ? "font-bold text-[#c45500]" : "text-gray-600"
                        }`}
                      >
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < stars ? "text-amber-400" : "text-gray-200"} />
                          ))}
                        </div>
                        <span>& Up</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={handleResetFilters}
                    className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded border border-gray-300 text-xs transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </aside>

            {/* Product Grid Area (3 cols) */}
            <main className="col-span-1 md:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white p-4 border border-gray-200 rounded animate-pulse h-72">
                      <div className="h-40 bg-gray-200 rounded mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <p className="text-gray-600 font-semibold mb-2">No products match your criteria.</p>
                  <p className="text-xs text-gray-400 mb-4">Try clearing some filters or searching for different keywords.</p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-[#ffd814] text-xs font-semibold rounded-full border border-[#fcd200]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination Bar */}
                  {pagination.total_pages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2 text-xs">
                      <button
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page <= 1}
                        className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      {[...Array(pagination.total_pages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded border text-xs font-medium ${
                              pagination.current_page === pageNum
                                ? "bg-amber-100 border-[#f08804] text-[#c45500] font-bold"
                                : "bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page >= pagination.total_pages}
                        className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>

          <RecentlyViewed />
        </div>
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Shop;
