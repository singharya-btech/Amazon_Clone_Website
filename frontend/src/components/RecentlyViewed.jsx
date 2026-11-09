import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getRecentlyViewed } from "../services/productService";

const RecentlyViewed = ({ currentProductId }) => {
  const { recentlyViewedIds } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Exclude currently viewed product
    const idsToFetch = recentlyViewedIds.filter(
      (id) => String(id) !== String(currentProductId)
    );

    if (idsToFetch.length === 0) {
      setProducts([]);
      return;
    }

    let active = true;
    setLoading(true);

    getRecentlyViewed(idsToFetch)
      .then((data) => {
        if (active) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [recentlyViewedIds, currentProductId]);

  if (products.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recently Viewed Items</h3>
      {loading ? (
        <div className="text-xs text-gray-400">Loading recently viewed products...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((item) => (
            <Link
              key={item.id}
              to={`/product/${item.slug || item.id}`}
              className="bg-white border border-gray-200 rounded p-3 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="h-28 w-full flex items-center justify-center mb-2">
                <img
                  src={item.image}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800 line-clamp-2 hover:text-[#c45500]">
                  {item.name}
                </p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  ${Number(item.price).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewed;
