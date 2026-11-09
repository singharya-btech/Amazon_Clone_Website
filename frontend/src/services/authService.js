import api from "./api";

// ---------------------------------------------------------------------------
// Offline fallback
// ---------------------------------------------------------------------------
// The real backend isn't wired up yet. Rather than block testing on that,
// registerUser/loginUser try the real API first and, ONLY if the request
// never reached a server at all (a network error — no backend running),
// fall back to a local mock user store. The moment a real backend is running
// at VITE_API_URL, these calls succeed for real and the fallback is never
// used. Nothing about the calling pages (Login, Register, AdminLogin,
// AdminRegister) needs to change.
// ---------------------------------------------------------------------------

const MOCK_USERS_KEY = "amazonclone_mock_users";

function isNetworkError(err) {
  // Axios sets `error.response` when the server responded (even with 4xx/5xx).
  // It's undefined when the request never reached a server at all.
  return !err.response;
}

function readMockUsers() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function writeMockUsers(list) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(list));
}

function offlineError(message) {
  const err = new Error(message);
  err.response = { data: message };
  return err;
}

function mockRegister(userData) {
  const users = readMockUsers();
  const exists = users.some(
    (u) => u.username.toLowerCase() === String(userData.username).toLowerCase()
  );
  if (exists) {
    throw offlineError(
      "An account with this username/email already exists (offline mode — backend not connected)."
    );
  }

  const user = {
    id: Date.now(),
    username: userData.username,
    email: userData.email,
    first_name: userData.first_name || "",
    last_name: userData.last_name || "",
  };

  writeMockUsers([...users, { ...user, password: userData.password }]);

  const token = `mock-token-${user.id}`;
  localStorage.setItem("token", token);
  return { user, access: token };
}

function mockLogin({ username, password }) {
  const users = readMockUsers();
  const found = users.find(
    (u) =>
      u.username.toLowerCase() === String(username).toLowerCase() &&
      u.password === password
  );
  if (!found) {
    throw offlineError(
      "Invalid credentials, or no offline account exists yet — try registering first (backend not connected)."
    );
  }

  const { password: _pw, ...user } = found;
  const token = `mock-token-${user.id}`;
  localStorage.setItem("token", token);
  return { user, access: token };
}

// ---------------------------------------------------------------------------
// Public API — same signatures as before
// ---------------------------------------------------------------------------

export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register/", userData);
    const token = response.data.access || response.data.token;
    if (token) localStorage.setItem("token", token);
    return response.data;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn("[Amazon Clone] Backend unreachable — using offline mock auth for registration.");
      return mockRegister(userData);
    }
    throw err;
  }
};

// Admin register/login use their own "adminToken" key (see services/api.js)
// so an admin session doesn't overwrite — or get overwritten by — a
// customer session in the same browser.
export const registerAdmin = async (userData) => {
  try {
    const response = await api.post("/auth/admin-register/", userData);
    const token = response.data.access || response.data.token;
    if (token) localStorage.setItem("adminToken", token);
    return response.data;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn("[Amazon Clone] Backend unreachable — using offline mock auth for admin registration.");
      const result = mockRegister(userData);
      result.user.is_staff = true; // offline mode has no real permission system — just unlock the UI
      return result;
    }
    throw err;
  }
};

export const loginAdmin = async (userData) => {
  try {
    const response = await api.post("/auth/login/", userData);
    const token = response.data.access || response.data.token;
    if (token) localStorage.setItem("adminToken", token);
    return response.data;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn("[Amazon Clone] Backend unreachable — using offline mock auth for admin login.");
      const result = mockLogin(userData);
      result.user.is_staff = true;
      return result;
    }
    throw err;
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await api.post("/auth/login/", userData);
    const token = response.data.access || response.data.token;
    if (token) localStorage.setItem("token", token);
    return response.data;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn("[Amazon Clone] Backend unreachable — using offline mock auth for login.");
      return mockLogin(userData);
    }
    throw err;
  }
};

// Logout — only clears the customer session. Seller/admin sessions live
// under their own keys (sellerToken/adminToken) and are cleared separately
// so logging out of one role doesn't silently log you out of another.
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const logoutAdmin = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
};

// Get Current User
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me/");
  return response.data;
};
