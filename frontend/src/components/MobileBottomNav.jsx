import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaShoppingBag, FaHeart, FaShoppingCart } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();
  const { totalWishlistItems } = useWishlist();

  const navItems = [
    { label: "Home", path: "/", icon: FaHome },
    { label: "Shop", path: "/shop", icon: FaShoppingBag },
    { label: "Wishlist", path: "/wishlist", icon: FaHeart, badge: totalWishlistItems },
    { label: "Cart", path: "/cart", icon: FaShoppingCart, badge: totalItems },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#131921] border-t border-gray-800 z-50 px-2 py-1 flex justify-around items-center text-white">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-1 px-3 rounded text-xs relative ${
              isActive ? "text-[#f08804] font-semibold" : "text-gray-300 hover:text-white"
            }`}
          >
            <div className="relative">
              <Icon className="text-lg" />
              {item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#f08804] text-[#111] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
