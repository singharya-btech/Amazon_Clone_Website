import api from "./api";

// Register User
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register/", userData);
  const token = response.data.access || response.data.token;
  if (token) {
    localStorage.setItem("token", token);
  }
  return response.data;
};

// Login User
export const loginUser = async (userData) => {
  const response = await api.post("/auth/login/", userData);
  const token = response.data.access || response.data.token;
  if (token) {
    localStorage.setItem("token", token);
  }
  return response.data;
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("adminUser");
};

// Email Verification
export const verifyEmail = async (token) => {
  const response = await api.post("/auth/verify-email/", { token });
  return response.data;
};

export const resendVerificationEmail = async (email) => {
  const response = await api.post("/auth/resend-verification/", { email });
  return response.data;
};

// Forgot & Reset Password
export const requestPasswordReset = async (email) => {
  const response = await api.post("/auth/forgot-password/", { email });
  return response.data;
};

export const confirmPasswordReset = async (token, new_password) => {
  const response = await api.post("/auth/reset-password/", { token, new_password });
  return response.data;
};

// Change Password
export const changePassword = async (passwordData) => {
  const response = await api.post("/auth/change-password/", passwordData);
  return response.data;
};

// User Profile
export const getCurrentUser = async () => {
  const response = await api.get("/auth/profile/");
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put("/auth/profile/", profileData);
  return response.data;
};

// Address Management
export const getAddresses = async () => {
  const response = await api.get("/auth/addresses/");
  return response.data;
};

export const createAddress = async (addressData) => {
  const response = await api.post("/auth/addresses/", addressData);
  return response.data;
};

export const updateAddress = async (id, addressData) => {
  const response = await api.put(`/auth/addresses/${id}/`, addressData);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await api.delete(`/auth/addresses/${id}/`);
  return response.data;
};

export const setDefaultAddress = async (id) => {
  const response = await api.post(`/auth/addresses/${id}/set-default/`);
  return response.data;
};

// Customer Notification Center
export const getNotifications = async () => {
  const response = await api.get("/notifications/");
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.post(`/notifications/${id}/mark-read/`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put("/notifications/");
  return response.data;
};
