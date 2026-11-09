import api from "./api";

// Get All Products (supports pagination, sorting, and filtering)
export const getProducts = async (filters = {}) => {
  const response = await api.get("/products/", { params: filters });
  return response.data;
};

// Get Product By Slug or ID (includes gallery_images, variants, specs, availability)
export const getProductById = async (slug) => {
  const response = await api.get(`/products/${slug}/`);
  return response.data;
};

// Search Products
export const searchProducts = async (keyword) => {
  const response = await api.get("/products/", { params: { search: keyword } });
  return response.data;
};

// Get Products By Category
export const getProductsByCategory = async (category) => {
  const response = await api.get("/products/", { params: { category } });
  return response.data;
};

// Get Featured Products
export const getFeaturedProducts = async () => {
  const response = await api.get("/products/featured/");
  return response.data;
};

// Get Product Variants
export const getProductVariants = async (productId) => {
  const response = await api.get(`/products/${productId}/variants/`);
  return response.data;
};

// Get Recently Viewed Products
export const getRecentlyViewed = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const response = await api.post("/products/recently-viewed/", { ids });
  return response.data;
};

// Coupon Simulation
export const validateCoupon = async (code, subtotal) => {
  const response = await api.post("/coupons/validate/", { code, subtotal });
  return response.data;
};

// Create Product
export const createProduct = async (productData) => {
  const response = await api.post("/products/", productData);
  return response.data;
};

export const deleteProduct = async (slug) => {
  await api.delete(`/products/${slug}/`);
};
