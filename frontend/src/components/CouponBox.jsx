import React, { useState } from "react";
import { useCart } from "../context/CartContext";

const CouponBox = () => {
  const { coupon, couponError, couponLoading, applyCouponCode, removeCoupon } = useCart();
  const [inputCode, setInputCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleApply = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setSuccessMessage("");
    const res = await applyCouponCode(inputCode);
    if (res.success) {
      setSuccessMessage(res.message);
      setInputCode("");
    }
  };

  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-800">Promo / Gift Coupon</span>
        <span className="text-xs text-gray-500 font-mono">Try: SAVE10, FLAT25</span>
      </div>

      {coupon ? (
        <div className="flex items-center justify-between bg-white border border-emerald-300 rounded px-3 py-2 text-xs">
          <div>
            <span className="font-bold text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded mr-2">
              {coupon.code}
            </span>
            <span className="text-emerald-700">
              {coupon.discount_type === "percent"
                ? `${coupon.discount_value}% off`
                : `$${coupon.discount_value} off`} applied
            </span>
          </div>
          <button
            onClick={removeCoupon}
            className="text-red-600 hover:text-red-800 font-semibold text-xs ml-2"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Enter promo code"
            className="flex-1 text-xs border border-gray-300 rounded px-3 py-1.5 uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#f08804]"
          />
          <button
            type="submit"
            disabled={couponLoading || !inputCode.trim()}
            className="px-4 py-1.5 bg-[#f08804] hover:bg-[#d87604] text-[#111] font-semibold text-xs rounded transition disabled:opacity-50"
          >
            {couponLoading ? "Checking..." : "Apply"}
          </button>
        </form>
      )}

      {couponError && <p className="text-xs text-red-600 mt-1.5">{couponError}</p>}
      {successMessage && <p className="text-xs text-emerald-600 mt-1.5">{successMessage}</p>}
    </div>
  );
};

export default CouponBox;
