import api from "./api";

export const getProductReviews = async (slug) => {
  const response = await api.get(`/products/${slug}/reviews/`);
  return response.data;
};

export const createProductReview = async (slug, review) => {
  const response = await api.post(`/products/${slug}/reviews/`, review);
  return response.data;
};
