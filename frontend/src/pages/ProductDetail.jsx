import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";

import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./ProductDetail.css";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getProductById } from "../mock/marketplace";
import {
  getProductReviews,
  getReviewEligibility,
  submitReview,
} from "../api/reviews";

function findLegacyAdminProduct(id) {
  try {
    const stored = localStorage.getItem("products");
    const list = stored ? JSON.parse(stored) : [];
    const found = list.find((p) => String(p.id) === String(id));
    if (!found) return null;
    // legacy admin-added shape already close to what this page expects
    return {
      id: found.id,
      title: found.title,
      image: found.image,
      price: found.price,
      rating: found.rating || 4,
      description: found.description || "",
    };
  } catch (e) {
    return null;
  }
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadReviews = async (productId) => {
    try {
      setReviews(await getProductReviews(productId));
    } catch (e) {
      // product may not exist on the backend (legacy/demo item) — no reviews then
      setReviews([]);
    }
    if (user) {
      try {
        setEligibility(await getReviewEligibility(productId));
      } catch (e) {
        setEligibility(null);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProduct(null);

    (async () => {
      // 1. Try the real backend first (verified-seller / admin-added products)
      try {
        const p = await getProductById(id);
        if (!cancelled) {
          setProduct(p);
          setLoading(false);
          loadReviews(id);
          return;
        }
      } catch (e) {
        // not found on the backend — fall through to local sources
      }

      // 2. Legacy admin quick-add products (localStorage)
      const legacy = findLegacyAdminProduct(id);
      if (!cancelled) setProduct(legacy || null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSubmitting(true);
    try {
      await submitReview(product.id, Number(reviewForm.rating), reviewForm.comment.trim());
      setReviewForm({ rating: 5, comment: "" });
      await loadReviews(product.id);
    } catch (err) {
      const message = err.response?.data?.detail || err.message || "Could not submit your review.";
      setReviewError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Navbar />
        <div className="productNotFound"><h2>Loading…</h2></div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <Navbar />
        <div className="productNotFound">
          <h2>Product Not Found</h2>
          <p>It may have been removed, or its seller is no longer verified.</p>
        </div>
        <Footer />
      </>
    );
  }

  const stars = Math.max(0, Math.min(5, Math.round(product.rating || 0)));

  return (
    <>
      <Header />
      <Navbar />

      <div className="productDetail">

        <div className="productDetail__image">
          <img src={product.image} alt={product.title} />
        </div>

        <div className="productDetail__info">

          <h1>{product.title}</h1>

          {product.sellerName && (
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Sold by {product.sellerName}</p>
          )}

          <div className="rating">
            {[...Array(stars)].map((_, index) => (
              <FaStar key={index} />
            ))}
          </div>

          <h2>₹{product.price}</h2>

          <p>{product.description}</p>

          <div className="quantity">
            <label>Quantity</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
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

          <button
            className="buyBtn"
            onClick={() => {
              addToCart({ ...product, quantity });
              navigate("/checkout");
            }}
          >
            Buy Now
          </button>

        </div>

      </div>

      <div className="productDetail__reviews" style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <h2 style={{ marginBottom: 16 }}>Customer Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>

        {user && eligibility?.canReview && (
          <form onSubmit={handleSubmitReview} style={{ marginBottom: 24, padding: 16, border: "1px solid var(--line)", borderRadius: 6 }}>
            <h3 style={{ marginBottom: 8 }}>Write a review</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <label>Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
              >
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <textarea
              placeholder="Share your experience with this product..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              style={{ width: "100%", minHeight: 80, padding: 8, border: "1px solid var(--line)", borderRadius: 4 }}
            />
            {reviewError && <p style={{ color: "crimson" }}>{reviewError}</p>}
            <button className="cartBtn" type="submit" disabled={reviewSubmitting} style={{ marginTop: 8 }}>
              {reviewSubmitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}

        {user && eligibility && !eligibility.hasPurchased && (
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            Only customers who've purchased this product can leave a review.
          </p>
        )}
        {user && eligibility && eligibility.hasPurchased && !eligibility.isDelivered && !eligibility.alreadyReviewed && (
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
            You'll be able to review this once your order has been delivered.
          </p>
        )}
        {user && eligibility?.alreadyReviewed && (
          <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>You've already reviewed this product.</p>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No reviews yet — be the first to share your experience.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ padding: 14, border: "1px solid var(--line)", borderRadius: 6 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="rating">
                    {[...Array(r.rating)].map((_, i) => <FaStar key={i} />)}
                  </div>
                  <strong>{r.customerName}</strong>
                </div>
                {r.comment && <p style={{ marginTop: 6 }}>{r.comment}</p>}

                {r.replies.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {r.replies.map((reply, i) => (
                      <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 4, padding: 8 }}>
                        <strong style={{ textTransform: "capitalize" }}>{reply.authorRole}</strong> ({reply.authorName}): {reply.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default ProductDetail;
