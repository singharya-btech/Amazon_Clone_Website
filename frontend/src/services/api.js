import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Endpoints that are always meant to be anonymous — never attach a token
// here, even if a (possibly stale) one exists in localStorage. Sending an
// invalid/expired token on these causes the backend to reject the request
// with an auth error instead of treating it as a normal anonymous call.
const PUBLIC_ENDPOINTS = [
  "/auth/register",
  "/auth/admin-register",
  "/auth/login",
  "/auth/token/refresh",
  "/sellers/register",
  "/sellers/login",
];

function isPublicEndpoint(url = "") {
  return PUBLIC_ENDPOINTS.some((p) => url.includes(p));
}

// ---------------------------------------------------------------------------
// Multi-role token storage
// ---------------------------------------------------------------------------
// Customer, seller, and admin are three separate Django Users/accounts, but
// everything used to be stashed under a single "token" key in localStorage.
// That meant logging in as one role silently clobbered whichever role was
// logged in before it — e.g. a seller checking their orders after a customer
// login (even in another tab, since localStorage is shared per-origin) would
// send the *customer's* JWT to a seller-only endpoint, get a 403/404 back,
// and the dashboard would just render empty with no explanation. Giving each
// role its own storage key lets a customer session and a seller session (and
// an admin session) coexist, which is how sellers actually test their own
// storefront in practice.
const SELLER_PATH_PATTERNS = ["/sellers/me", "/orders/seller", "/reviews/seller", "/support/seller"];
const ADMIN_PATH_PATTERNS = [
  "/sellers/admin",
  "/products/admin",
  "/reviews/admin",
  "/support/admin",
  "/auth/admin",
  "/auth/superadmin",
];

export function tokenKeyFor(url = "") {
  if (SELLER_PATH_PATTERNS.some((p) => url.includes(p))) return "sellerToken";
  if (ADMIN_PATH_PATTERNS.some((p) => url.includes(p))) return "adminToken";
  return "token";
}

// Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const key = tokenKeyFor(config.url);
    const token = localStorage.getItem(key);

    if (token && !isPublicEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(error.response?.data || error.message);

    // A stale/invalid token (e.g. pointing at a user that no longer exists
    // after a backend database reset) will keep failing every authenticated
    // request forever unless cleared. Self-heal instead of getting stuck —
    // but only clear the token for the role this request was actually using,
    // so a bad seller token doesn't log the customer out too (and vice versa).
    if (error.response?.status === 401) {
      localStorage.removeItem(tokenKeyFor(error.config?.url));
    }

    return Promise.reject(error);
  }
);

export default api;
