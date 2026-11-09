import api from "./api";

// Place Order (Transaction safe)
export const placeOrder = async (orderData) => {
  const response = await api.post("/orders/", orderData);
  return response.data;
};

// Get User Orders
export const getOrders = async () => {
  const response = await api.get("/orders/");
  return response.data;
};

// Get Single Order Detail
export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}/`);
  return response.data;
};

// Cancel Order (restores stock)
export const cancelOrder = async (id, reason = "Cancelled by customer") => {
  const response = await api.post(`/orders/${id}/cancel/`, { reason });
  return response.data;
};

// Request Return
export const returnOrder = async (id, reason) => {
  const response = await api.post(`/orders/${id}/return/`, { reason });
  return response.data;
};

// Request / Process Refund
export const refundOrder = async (id, reason) => {
  const response = await api.post(`/orders/${id}/refund/`, { reason });
  return response.data;
};

// Reorder Previous Purchase (Copies items into active cart)
export const reorderOrder = async (id) => {
  const response = await api.post(`/orders/${id}/reorder/`);
  return response.data;
};

// Get Invoice URL
export const getInvoiceUrl = (id) => {
  const baseURL = api.defaults.baseURL || "http://localhost:8001/api";
  return `${baseURL}/orders/${id}/invoice/`;
};

// Coupons
export const validateCoupon = async (code, subtotal) => {
  const response = await api.post("/coupons/validate/", { code, subtotal });
  return response.data;
};

export const getActiveCoupons = async () => {
  const response = await api.get("/coupons/active/");
  return response.data;
};
