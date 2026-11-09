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
