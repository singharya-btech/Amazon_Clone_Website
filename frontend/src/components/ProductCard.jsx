import React from "react";
import { Link } from "react-router-dom";
import "./ProductCard.css";
import { FaStar } from "react-icons/fa";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  if (!product) return null;

  const handleAdd = () => {
    addToCart({ ...product, quantity: 1 });
  };

  return (
    <div className="productCard">
      <Link to={`/product/${product.slug || product.id}`} className="productCard__link" aria-label={`View ${product.title}`}>
        <img
          src={product.image}
          alt={product.title}
          className="productCard__image"
        />
      </Link>

      <div className="productCard__info">
        <Link to={`/product/${product.slug || product.id}`} className="productCard__link">
          <h3 className="productCard__title">{product.title}</h3>
        </Link>

        <p className="productCard__price">
          <small>₹</small>
          <strong>{product.price}</strong>
        </p>

        <div className="productCard__rating">
          {[...Array(product.rating)].map((_, index) => (
            <FaStar key={index} className="star" />
          ))}
        </div>

        <button className="productCard__button" onClick={handleAdd}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
