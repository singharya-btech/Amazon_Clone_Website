import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MobileBottomNav from "../components/MobileBottomNav";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (item) => {
    addToCart(item, null, 1);
    removeFromWishlist(item.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Wishlist ❤️</h1>
              <p className="text-sm text-gray-500 mt-1">
                Saved locally on this device ({wishlistItems.length} items)
              </p>
            </div>
            {wishlistItems.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-sm text-red-600 hover:text-red-800 transition"
              >
                Clear Wishlist
              </button>
            )}
          </div>

          {wishlistItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🤍</div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-6">
                Explore products and click the heart icon to save items for later.
              </p>
              <Link
                to="/shop"
                className="inline-block bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-6 py-2 rounded-md shadow-sm transition"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition bg-white"
                >
                  <div>
                    <Link to={`/product/${item.id}`} className="block aspect-square mb-3 overflow-hidden rounded">
                      <img
                        src={item.image || "https://placehold.co/300x300?text=Product"}
                        alt={item.name}
                        className="w-full h-full object-contain hover:scale-105 transition"
                      />
                    </Link>

                    {item.brand && (
                      <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                        {item.brand}
                      </span>
                    )}

                    <Link
                      to={`/product/${item.id}`}
                      className="block font-semibold text-gray-800 hover:text-amber-700 text-sm line-clamp-2 mt-1"
                    >
                      {item.name}
                    </Link>

                    <div className="mt-2 text-lg font-bold text-gray-900">
                      ₹{Number(item.price).toFixed(2)}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-medium py-2 rounded text-sm transition shadow-sm"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="w-full text-xs text-gray-500 hover:text-red-600 py-1 transition"
                    >
                      Remove from Wishlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Wishlist;
