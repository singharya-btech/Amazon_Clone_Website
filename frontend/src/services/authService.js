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

// Get Current User
export const getCurrentUser = async () => {
  const response = await api.get("/auth/profile/");
  return response.data;
};

// Update Current User
export const updateUser = async (userData) => {
  const response = await api.patch("/auth/profile/", userData);
  return response.data;
};

// Change Current User Password
export const changePassword = async (passwordData) => {
  const response = await api.post("/auth/change-password/", passwordData);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post("/auth/password-reset/", { email });
  return response.data;
};

export const confirmPasswordReset = async (uid, token, passwordData) => {
  const response = await api.post(`/auth/password-reset/${uid}/${token}/`, passwordData);
  return response.data;
};
