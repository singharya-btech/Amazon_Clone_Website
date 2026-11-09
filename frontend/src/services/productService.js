import api from "./api";

// Get All Products
export const getProducts = async (filters = {}) => {
  const response = await api.get("/products/", { params: filters });
  return response.data;
};

// Get Product By Slug
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

// Create Product
export const createProduct = async (productData) => {
  const response = await api.post("/products/", productData);
  return response.data;
};

export const deleteProduct = async (slug) => {
  await api.delete(`/products/${slug}/`);
};
