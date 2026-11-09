import React, { useState, useEffect } from "react";
import { compareProducts } from "../services/productService";
import { useCart } from "../context/CartContext";

const ProductComparisonModal = ({ productIds = [], isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOpen && productIds.length > 0) {
      setLoading(true);
      compareProducts(productIds)
        .then((res) => setData(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, productIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900">Compare Products Side-by-Side</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center text-gray-500">Loading comparison matrix...</div>
          ) : !data || data.products.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No products selected for comparison.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 bg-gray-50 font-bold text-gray-700 w-44">Feature</th>
                  {data.products.map((p) => (
                    <th key={p.id} className="p-3 text-center w-56">
                      <img
                        src={p.image || "https://placehold.co/120x120?text=Product"}
                        alt={p.name}
                        className="w-24 h-24 object-contain mx-auto mb-2"
                      />
                      <div className="font-bold text-gray-900 line-clamp-2 h-8">{p.name}</div>
                      <div className="text-sm font-extrabold text-amber-700 my-1">₹{p.price}</div>
                      <button
                        onClick={() => addToCart(p, null, 1)}
                        className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-1 px-3 rounded text-[11px] shadow-sm transition"
                      >
                        Add to Cart
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-3 bg-gray-50 font-semibold text-gray-600">Customer Rating</td>
                  {data.products.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      <span className="text-amber-500 font-bold">★ {p.rating || "N/A"}</span>
                      <span className="text-gray-400 text-[10px] block">({p.num_reviews} reviews)</span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 bg-gray-50 font-semibold text-gray-600">Brand</td>
                  {data.products.map((p) => (
                    <td key={p.id} className="p-3 text-center font-medium text-gray-800">
                      {p.brand || "Generic"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-3 bg-gray-50 font-semibold text-gray-600">Availability</td>
                  {data.products.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      {p.stock > 0 ? (
                        <span className="text-emerald-600 font-bold">In Stock ({p.stock})</span>
                      ) : (
                        <span className="text-red-600 font-bold">Out of Stock</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Specifications */}
                {data.specification_keys.map((key) => (
                  <tr key={key}>
                    <td className="p-3 bg-gray-50 font-semibold text-gray-600">{key}</td>
                    {data.products.map((p) => (
                      <td key={p.id} className="p-3 text-center text-gray-800 font-mono">
                        {p.specifications?.[key] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductComparisonModal;
