import api from "./api";

// Place Order
export const placeOrder = async (orderData) => {
  const response = await api.post("/orders/", orderData);
  return response.data;
};

// Get Orders
export const getOrders = async () => {
  const response = await api.get("/orders/");
  return response.data;
};

// Get Order By ID
export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}/`);
  return response.data;
};

// Cancel Order
export const cancelOrder = async (id) => {
  const response = await api.delete(`/orders/${id}/`);
  return response.data;
};

// --- Seller-facing order management -----------------------------------
// List every order containing at least one of the logged-in seller's
// products.
export const getSellerOrders = async () => {
  const response = await api.get("/orders/seller/mine/");
  return response.data;
};

// Update the shipping status of just the seller's own item within an order.
// itemStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export const updateSellerOrderItemStatus = async (orderId, productId, itemStatus) => {
  const response = await api.patch(
    `/orders/seller/mine/${orderId}/items/${productId}/status/`,
    { item_status: itemStatus }
  );
  return response.data;
};
