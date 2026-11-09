import api from "../services/api";

function toUiReview(r) {
  return {
    id: r.id,
    productId: r.product,
    productName: r.product_name,
    customerName: r.customer_name,
    rating: r.rating,
    comment: r.comment,
    replies: (r.replies || []).map((reply) => ({
      authorRole: reply.author_role,
      authorName: reply.author_name,
      message: reply.message,
      createdAt: reply.created_at,
    })),
    createdAt: r.created_at,
  };
}

// Public: reviews for a product's page
export async function getProductReviews(productId) {
  const { data } = await api.get(`/reviews/product/${productId}/`);
  return data.map(toUiReview);
}

// Customer: can they review this product? (must have bought it, and not
// have reviewed it already)
export async function getReviewEligibility(productId) {
  const { data } = await api.get("/reviews/eligibility/", { params: { product_id: productId } });
  return {
    canReview: data.can_review,
    hasPurchased: data.has_purchased,
    isDelivered: data.is_delivered,
    alreadyReviewed: data.already_reviewed,
  };
}

// Customer: submit a review
export async function submitReview(productId, rating, comment) {
  const { data } = await api.post("/reviews/", { product_id: productId, rating, comment });
  return toUiReview(data);
}

// Seller: view + reply to reviews on their products
export async function getSellerReviews() {
  const { data } = await api.get("/reviews/seller/mine/");
  return data.map(toUiReview);
}

export async function replySellerReview(id, message) {
  const { data } = await api.post(`/reviews/seller/mine/${id}/reply/`, { message });
  return toUiReview(data);
}

// Admin: view all + reply to any review
export async function getAdminReviews() {
  const { data } = await api.get("/reviews/admin/");
  return data.map(toUiReview);
}

export async function replyAdminReview(id, message) {
  const { data } = await api.post(`/reviews/admin/${id}/reply/`, { message });
  return toUiReview(data);
}
