import api from "./api";

// Get All Products
export const getProducts = async () => {
  const response = await api.get("/products/");
  return response.data;
};

// Get Product By ID
export const getProductById = async (id) => {
  const response = await api.get(`/products/id/${id}/`);
  return response.data;
};

// Search Products
export const searchProducts = async (keyword) => {
  const response = await api.get("/products/search/", { params: { q: keyword } });
  return response.data;
};

// Get Products By Category
export const getProductsByCategory = async (category) => {
  const response = await api.get("/products/", { params: { category } });
  return response.data;
};

// Create Product (admin quick-add — stores in localStorage, not the backend)
export const createProduct = async (productData) => {
  // The backend intentionally has no POST /products/ endpoint — products
  // must go through /sellers/me/products/ so they always have a seller.
  // Admin quick-add products are stored client-side in localStorage and
  // surfaced via the legacy fallback in ProductDetail.jsx.
  const stored = localStorage.getItem("products");
  const products = stored ? JSON.parse(stored) : [];
  const newProduct = {
    id: Date.now(),
    ...productData,
  };
  products.unshift(newProduct);
  localStorage.setItem("products", JSON.stringify(products));
  return newProduct;
};
