import api from "./api";

// Get Wishlist
export const getWishlist = async () => {
  const response = await api.get("/wishlist/");
  return response.data;
};

// Toggle Product in Wishlist
export const addWishlist = async (product) => {
  const response = await api.post("/wishlist/", product);
  return response.data;
};

// Remove Product from Wishlist
export const removeWishlist = async (productId) => {
  const response = await api.delete("/wishlist/", {
    data: { product_id: productId },
  });
  return response.data;
};
