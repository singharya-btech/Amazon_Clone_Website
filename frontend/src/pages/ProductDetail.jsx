import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaStar } from "react-icons/fa";

import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  product1,
  product2,
  product3,
  product4,
  product5,
  product6,
} from "../assets";

import "./ProductDetail.css";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createProductReview, getProductReviews } from "../services/reviewService";
import { getProductById } from "../services/productService";

const products = [
  {
    id: "1",
    title: "Men's T-Shirt",
    image: product1,
    price: 999,
    rating: 5,
    category: "Fashion",
    brand: "ABC",
    description:
      "Focus on the vibe, fabric feel, and exact outfit pairings.",
  },
  {
    id: "2",
    title: "Men's Suit",
    image: product2,
    price: 899,
    rating: 4,
    category: "Fashion",
    brand: "ABC",
    description:
      "A deep midnight-navy wool that absorbs light, offering a rich, matte finish that feels as fluid as silk.",
  },
  {
    id: "3",
    title: "Children's Toy",
    image: product3,
    price: 349,
    rating: 5,
    category: "Games & Toys",
    brand: "PQR",
    description:
      "It is make for Children.",
  },
  {
    id: "4",
    title: "Toy Car",
    image: product4,
    price: 1299,
    rating: 5,
    category: "Games & Toys",
    brand: "PQR",
    description:
      "Toy Car for Children.",
  },
  {
    id: "5",
    title: "Smart Phone",
    image: product5,
    price: 199,
    rating: 4,
    category: "Electronics",
    brand: "Sumsung",
    description:
      "Sumsung Mobile Phone.",
  },
  {
    id: "6",
    title: "Phone",
    image: product6,
    price: 59,
    rating: 4,
    category: "Electronics",
    brand: "Sumsung",
    description:
      "Mobile Phone.",
  },
];

const ProductDetail = () => {
  const { id } = useParams();

  const [backendProduct, setBackendProduct] = useState(null);
  const [backendLoading, setBackendLoading] = useState(false);

  // Try to find the product in the hardcoded seed list first
  const localProduct = products.find((item) => String(item.id) === String(id));

  // If not found locally, fetch it from the backend (admin-added products live in MongoDB)
  useEffect(() => {
    if (localProduct) return;

    let active = true;
    const fetchBackendProduct = async () => {
      setBackendLoading(true);
      try {
        const data = await getProductById(id);
        if (active) {
          setBackendProduct({
            id: data.id,
            slug: data.slug,
            title: data.name,
            image: data.image,
            price: data.price,
            rating: data.rating,
            category: data.category_name || data.category,
            brand: data.brand,
            description: data.description,
            num_reviews: data.num_reviews,
          });
        }
      } catch (err) {
        console.error("Unable to load product from backend:", err);
      } finally {
        if (active) setBackendLoading(false);
      }
    };
    fetchBackendProduct();
    return () => {
      active = false;
    };
  }, [id, localProduct]);

  const product = localProduct || backendProduct;

  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    setReviewsLoading(true);
    setReviewError("");
    getProductReviews(id)
      .then((data) => active && setReviews(data))
      .catch(() => active && setReviewError("Reviews are unavailable right now. Please try again shortly."))
      .finally(() => active && setReviewsLoading(false));
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!user || !product) return;
    const userKey = user.username || user.id;
    try {
      const storageKey = `recentlyViewed_${userKey}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const viewedProduct = { ...product, viewedAt: new Date().toISOString() };
      const updated = [viewedProduct, ...existing.filter((item) => String(item.id) !== String(product.id))].slice(0, 8);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.error("Unable to save recently viewed product:", error);
    }
  }, [id, product, user]);

  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : product?.rating;
  const relatedProducts = product
    ? products.filter((item) => item.id !== product.id && (item.category === product.category || item.brand === product.brand)).slice(0, 4)
    : [];

  const submitReview = async (event) => {
    event.preventDefault();
    const comment = reviewComment.trim();
    if (!comment) return;

    const review = {
      author: reviewerName.trim() || "Customer",
      rating: reviewRating,
      comment,
    };
    setIsSubmittingReview(true);
    setReviewError("");
    try {
      const savedReview = await createProductReview(id, review);
      setReviews((current) => [savedReview, ...current]);
      setReviewComment("");
      setReviewRating(5);
    } catch {
      setReviewError("Your review could not be submitted. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!product) {
    return (
      <>
        <Header />
        <Navbar />

        <div className="productNotFound">
          <h2>{backendLoading ? "Loading product…" : "Product Not Found"}</h2>
        </div>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Navbar />

      <div className="productDetail">

        <div className="productDetail__image">
          <img
            src={product.image}
            alt={product.title}
          />
        </div>

        <div className="productDetail__info">

          <h1>{product.title}</h1>

          <div className="rating">
            {[...Array(Math.round(averageRating))].map((_, index) => (
              <FaStar key={index} />
            ))}
            <span>{averageRating} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</span>
          </div>

          <h2>₹{product.price}</h2>

          <p>{product.description}</p>

          <div className="quantity">

            <label>Quantity</label>

            <select
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>

          </div>

          <button
            className="cartBtn"
            onClick={() => addToCart({ ...product, quantity })}
          >
            Add to Cart
          </button>

          <button className="buyBtn">
            Buy Now
          </button>

        </div>

      </div>

      <section className="reviews" aria-labelledby="reviews-heading">
        <div className="reviews__heading">
          <div>
            <h2 id="reviews-heading">Customer reviews</h2>
            <div className="reviews__summary"><FaStar /> {averageRating} out of 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
          </div>
        </div>

        <form className="reviewForm" onSubmit={submitReview}>
          <h3>Write a review</h3>
          <input
            type="text"
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            placeholder="Your name (optional)"
            maxLength="100"
          />
          <div className="reviewForm__stars" aria-label={`Your rating: ${reviewRating} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button type="button" key={star} onClick={() => setReviewRating(star)} aria-label={`${star} star${star > 1 ? "s" : ""}`}>
                <FaStar className={star <= reviewRating ? "reviewForm__star--selected" : "reviewForm__star"} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="What did you like or dislike?"
            maxLength="1000"
            required
          />
          <button className="reviewForm__submit" type="submit" disabled={isSubmittingReview}>
            {isSubmittingReview ? "Submitting…" : "Submit review"}
          </button>
        </form>

        {reviewError && <p className="reviews__error" role="alert">{reviewError}</p>}

        <div className="reviews__list">
          {reviewsLoading ? <p className="reviews__empty">Loading reviews…</p> : reviews.length ? reviews.map((review) => (
            <article className="review" key={review.id}>
              <div className="review__stars">{[...Array(review.rating)].map((_, index) => <FaStar key={index} />)}</div>
              <strong>{review.author}</strong>
              <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>
              <p>{review.comment}</p>
            </article>
          )) : <p className="reviews__empty">No reviews yet. Be the first to review this product.</p>}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="relatedProducts" aria-labelledby="related-products-heading">
          <h2 id="related-products-heading">Related products</h2>
          <div className="relatedProducts__grid">
            {relatedProducts.map((item) => (
              <Link to={`/product/${item.id}`} className="relatedProducts__card" key={item.id}>
                <img src={item.image} alt={item.title} />
                <span>{item.title}</span>
                <strong>₹{item.price}</strong>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
};

export default ProductDetail;
