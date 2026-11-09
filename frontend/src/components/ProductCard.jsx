import React from "react";
import { Link } from "react-router-dom";
import "./ProductCard.css";
import { FaStar } from "react-icons/fa";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  if (!product) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, quantity: 1 });
  };

  const stars = Math.max(0, Math.min(5, Math.round(product.rating || 0)));

  return (
    <Link to={`/product/${product.id}`} className="productCard">
      <img
        src={product.image}
        alt={product.title}
        className="productCard__image"
      />

      <div className="productCard__info">
        <h3 className="productCard__title">{product.title}</h3>

        <p className="productCard__price">
          <small>₹</small>
          <strong>{product.price}</strong>
        </p>

        <div className="productCard__rating">
          {[...Array(stars)].map((_, index) => (
            <FaStar key={index} className="star" />
          ))}
        </div>

        <button className="productCard__button" onClick={handleAdd}>
          Add to Cart
        </button>
      </div>
    </Link>
  );
};

export default ProductCard;
