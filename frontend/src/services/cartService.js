import api from "./api";

// Get Cart
export const getCart = async () => {
  const response = await api.get("/cart/");
  return response.data;
};

// Add Product
export const addToCart = async (product) => {
  const response = await api.post("/cart/", product);
  return response.data;
};

// Update Quantity
export const updateCartItem = async (id, quantity) => {
  const response = await api.put(`/cart/items/${id}/`, {
    quantity,
  });

  return response.data;
};

// Remove Product
export const removeCartItem = async (id) => {
  const response = await api.delete(`/cart/items/${id}/`);
  return response.data;
};

// Clear Cart
export const clearCart = async () => {
  const response = await api.delete("/cart/");
  return response.data;
};
