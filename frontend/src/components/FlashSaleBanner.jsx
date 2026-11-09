import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getActiveFlashSales } from "../services/productService";

const FlashSaleBanner = () => {
  const [sales, setSales] = useState([]);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    getActiveFlashSales().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setSales(data);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (sales.length === 0 || !sales[0].end_time) return;

    const timer = setInterval(() => {
      const difference = new Date(sales[0].end_time) - new Date();
      if (difference <= 0) {
        setTimeLeft("Ending soon");
        clearInterval(timer);
      } else {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${hours.toString().padStart(2, "0")}h : ${minutes.toString().padStart(2, "0")}m : ${seconds.toString().padStart(2, "0")}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sales]);

  if (sales.length === 0) return null;
  const activeSale = sales[0];

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-semibold shadow flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-base animate-pulse">⚡</span>
        <span className="uppercase tracking-wider font-extrabold bg-black bg-opacity-30 px-2 py-0.5 rounded">
          FLASH SALE
        </span>
        <span>{activeSale.title}: Up to <span className="underline decoration-yellow-300 font-bold">{activeSale.discount_percent}% OFF</span></span>
      </div>

      <div className="flex items-center gap-4">
        {timeLeft && (
          <div className="bg-black bg-opacity-40 px-2.5 py-1 rounded font-mono text-xs">
            Ends in: <span className="text-yellow-300 font-bold">{timeLeft}</span>
          </div>
        )}
        <Link
          to="/shop?is_featured=true"
          className="bg-white text-gray-900 font-bold px-3 py-1 rounded hover:bg-yellow-100 transition shadow-sm text-xs"
        >
          Shop Deals &rarr;
        </Link>
      </div>
    </div>
  );
};

export default FlashSaleBanner;
