import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFrequentlyBoughtTogether } from "../services/productService";
import { useCart } from "../context/CartContext";

const FrequentlyBoughtTogether = ({ productId }) => {
  const [bundleData, setBundleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getFrequentlyBoughtTogether(productId)
      .then((data) => {
        if (data && data.bundle_items && data.bundle_items.length > 1) {
          setBundleData(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || !bundleData) return null;

  const handleAddBundleToCart = () => {
    bundleData.bundle_items.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
      });
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 my-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Frequently Bought Together
      </h2>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Thumbnails chain */}
        <div className="flex items-center flex-wrap gap-3">
          {bundleData.bundle_items.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && <span className="text-2xl font-bold text-gray-400">+</span>}
              <div className="text-center group">
                <Link to={`/product/${item.slug || item.id}`} className="block border rounded p-2 hover:shadow-md transition">
                  <img
                    src={item.image || "https://placehold.co/100x100?text=Item"}
                    alt={item.name}
                    className="w-24 h-24 object-contain mx-auto"
                  />
                </Link>
                <div className="text-xs font-bold text-gray-900 mt-2">₹{item.price}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Pricing and Action */}
        <div className="border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0 w-full lg:w-72">
          <div className="text-sm text-gray-500">
            Total Price: <span className="line-through">₹{bundleData.total_price.toFixed(2)}</span>
          </div>
          <div className="text-xl font-bold text-red-700 mt-0.5">
            Bundle Price: ₹{bundleData.bundle_price.toFixed(2)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mb-4">
            You Save: ₹{bundleData.bundle_discount.toFixed(2)} ({bundleData.savings_percent}% off bundle)
          </div>

          <button
            onClick={handleAddBundleToCart}
            disabled={added}
            className={`w-full py-2.5 px-4 rounded font-bold text-xs shadow transition ${
              added ? "bg-emerald-600 text-white" : "bg-amber-400 hover:bg-amber-500 text-gray-900"
            }`}
          >
            {added ? "✓ Added All to Cart!" : "Add all to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
