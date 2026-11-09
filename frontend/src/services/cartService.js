import api from "./api";

// Get Cart
export const getCart = async () => {
  const response = await api.get("/cart/");
  return response.data;
};

// Add Product to Cart
export const addToCart = async (product) => {
  const response = await api.post("/cart/", product);
  return response.data;
};

// Update Cart Item Quantity
export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put(`/cart/items/${itemId}/`, { quantity });
  return response.data;
};

// Remove Cart Item
export const removeCartItem = async (itemId) => {
  const response = await api.delete(`/cart/items/${itemId}/`);
  return response.data;
};
