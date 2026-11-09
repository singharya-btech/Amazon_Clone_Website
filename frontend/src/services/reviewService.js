import api from "./api";

// Get reviews for a product
export const getProductReviews = async (productId) => {
  const response = await api.get(`/v1/reviews/products/${productId}/`);
  return response.data;
};

// Submit / Update review (with optional title, images)
export const submitReview = async (reviewData) => {
  const response = await api.post("/v1/reviews/submit/", reviewData);
  return response.data;
};

// Vote on a review (helpful or unhelpful)
export const voteReview = async (reviewId, voteType) => {
  const response = await api.post(`/v1/reviews/${reviewId}/vote/`, { vote_type: voteType });
  return response.data;
};

// User's own reviews
export const getMyReviews = async () => {
  const response = await api.get("/v1/reviews/my-reviews/");
  return response.data;
};
