import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  mobiles,
  electronics,
  fashion,
  books,
  grocery,
  home as homeImg,
  toys,
} from "../assets";

import "./CategorySlider.css";

const categories = [
  { name: "Mobiles", img: mobiles },
  { name: "Electronics", img: electronics },
  { name: "Fashion", img: fashion },
  { name: "Books", img: books },
  { name: "Grocery", img: grocery },
  { name: "Home", img: homeImg },
  { name: "Toys", img: toys },
];

const CategorySlider = () => {
  const nav = useNavigate();
  const ref = useRef(null);

  const goToCategory = (cat) => {
    nav(`/shop?category=${encodeURIComponent(cat)}`);
  };

  const scroll = (dir = "right") => {
    if (!ref.current) return;
    const amount = ref.current.clientWidth * 0.7;
    ref.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  return (
    <div className="categorySliderWrap">
      <button className="csBtn prev" onClick={() => scroll("left")}>&lt;</button>
      <div className="categorySlider" ref={ref}>
        {categories.map((c) => (
          <div key={c.name} className="csCard" onClick={() => goToCategory(c.name)}>
            <img src={c.img} alt={c.name} />
            <span>{c.name}</span>
          </div>
        ))}
      </div>
      <button className="csBtn next" onClick={() => scroll("right")}>&gt;</button>
    </div>
  );
};

export default CategorySlider;
