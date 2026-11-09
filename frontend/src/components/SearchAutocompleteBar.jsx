import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { getAutocompleteSuggestions } from "../services/productService";

const SearchAutocompleteBar = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [suggestions, setSuggestions] = useState([]);
  const [previewProducts, setPreviewProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setPreviewProducts([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await getAutocompleteSuggestions(query.trim());
        setSuggestions(data.suggestions || []);
        setPreviewProducts(data.products || []);
        setIsOpen(true);
      } catch (e) {}
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectSuggestion = (term) => {
    setQuery(term);
    setIsOpen(false);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl mx-4">
      <form onSubmit={handleSearch} className="flex h-10 w-full rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-gray-300 focus-within:ring-2 focus-within:ring-amber-500">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 border-r focus:outline-none cursor-pointer hidden sm:block"
        >
          <option>All</option>
          <option>Electronics</option>
          <option>Laptops</option>
          <option>Audio</option>
          <option>Fashion</option>
        </select>

        <input
          type="text"
          placeholder="Search Amazon Clone with instant suggestions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          className="flex-1 px-3 py-1 text-sm text-gray-900 focus:outline-none"
        />

        <button
          type="submit"
          className="bg-amber-400 hover:bg-amber-500 text-gray-900 px-4 flex items-center justify-center transition"
        >
          <FaSearch className="text-gray-800 text-sm" />
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || previewProducts.length > 0) && (
        <div className="absolute top-11 left-0 right-0 bg-white rounded-md shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100">
          {/* Text Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-1">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(s)}
                  className="px-4 py-2 text-xs text-gray-700 hover:bg-amber-50 cursor-pointer flex items-center gap-2 font-medium"
                >
                  <span className="text-gray-400">🔍</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Product Previews */}
          {previewProducts.length > 0 && (
            <div className="p-2 bg-gray-50">
              <span className="text-[10px] uppercase font-bold text-gray-400 px-2 block mb-1">
                Matching Products
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/product/${p.slug || p.id}`);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer border border-transparent hover:border-gray-200 transition bg-white"
                  >
                    <img
                      src={p.image || "https://placehold.co/60x60?text=Product"}
                      alt={p.name}
                      className="w-10 h-10 object-contain p-0.5 rounded border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-gray-800 truncate">{p.name}</div>
                      <div className="text-xs font-bold text-amber-700">₹{p.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocompleteBar;
