// ---------------------------------------------------------------------------
// Amazon Clone marketplace API layer
// ---------------------------------------------------------------------------
// Talks to the real Django/MongoEngine backend. Function names match the
// original mock layer so calling pages didn't need restructuring — but since
// these are now real network calls, every function here is async and every
// caller must `await` it (this replaced the old synchronous localStorage
// version).
// ---------------------------------------------------------------------------

import api from "../services/api";

const SELLER_SESSION_KEY = "sellerUser";

// ---------------------------------------------------------------------------
// Shape adapters — the backend uses `name`/`category_name`, the UI was built
// around `title`/`category` (plain strings). Adapt at the boundary so pages
// don't need to change.
// ---------------------------------------------------------------------------

function toUiProduct(p) {
  return {
    id: p.id,
    title: p.name,
    price: p.price,
    rating: p.rating ?? 4,
    category: p.category_name || p.category || "",
    description: p.description || "",
    image: p.image || "",
    stock: p.stock ?? 0,
    sellerId: p.seller || null,
    sellerName: p.seller_name || null,
    isFlagged: !!p.is_flagged,
    flagReason: p.flag_reason || "",
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories() {
  const { data } = await api.get("/categories/");
  return data.map((c) => c.name);
}

// There's no dedicated "create category" endpoint — categories are created
// automatically server-side the moment a product is submitted with a new
// category name. This just lets the UI show the new option immediately.
//
// IMPORTANT: `knownCategories` must be the list currently held in the
// caller's own state, NOT a fresh fetch from the server. A newly-typed
// category doesn't exist in the database yet (it's only created once the
// product is actually submitted), so re-fetching from the server here would
// silently drop it — and if the seller then added a second category before
// submitting, that fetch-and-overwrite would erase the first one too. That
// was the "adding a second category loses the first" bug.
export async function addCategory(name, knownCategories) {
  const clean = name.trim();
  const existing = Array.isArray(knownCategories) ? knownCategories : await getCategories();
  if (!clean || existing.some((c) => c.toLowerCase() === clean.toLowerCase())) {
    return existing;
  }
  return [...existing, clean];
}

// ---------------------------------------------------------------------------
// Sellers
// ---------------------------------------------------------------------------

export async function registerSeller(data) {
  const { data: res } = await api.post("/sellers/register/", {
    business_name: data.businessName,
    owner_name: data.ownerName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    password2: data.confirmPassword,
    category_focus: data.categoryFocus,
    registration_id: data.registrationId || "",
    business_description: data.businessDescription,
  });
  if (res.access) localStorage.setItem("sellerToken", res.access);
  return fromApiSeller(res.seller);
}

export async function authenticateSeller(email, password) {
  const { data: res } = await api.post("/sellers/login/", { email, password });
  if (res.access) localStorage.setItem("sellerToken", res.access);
  return fromApiSeller(res.seller);
}

function fromApiSeller(s) {
  return {
    id: s.id,
    businessName: s.business_name,
    ownerName: s.owner_name,
    email: s.email,
    phone: s.phone,
    categoryFocus: s.category_focus,
    businessDescription: s.business_description,
    registrationId: s.registration_id,
    status: s.status,
    isFlagged: !!s.is_flagged,
    flagReason: s.flag_reason || "",
    createdAt: s.created_at,
  };
}

export async function getSellers(statusFilter) {
  const { data } = await api.get("/sellers/admin/", {
    params: statusFilter ? { status: statusFilter } : {},
  });
  return data.map(fromApiSeller);
}

export async function getSellerById(id) {
  // Admin-scoped lookup isn't a single-record endpoint on the backend;
  // pull the list and find it (fine at this project's scale).
  const sellers = await getSellers();
  return sellers.find((s) => String(s.id) === String(id)) || null;
}

export async function verifySeller(id) {
  const { data } = await api.post(`/sellers/admin/${id}/verify/`);
  return fromApiSeller(data);
}

export async function rejectSeller(id) {
  const { data } = await api.post(`/sellers/admin/${id}/reject/`);
  return fromApiSeller(data);
}

export async function removeSeller(id) {
  await api.delete(`/sellers/admin/${id}/`);
}

// Admin: flag/unflag a seller (SuperAdmin removes via removeSeller above)
export async function flagSeller(id, reason) {
  const { data } = await api.post(`/sellers/admin/${id}/flag/`, { reason });
  return fromApiSeller(data);
}

export async function unflagSeller(id) {
  const { data } = await api.post(`/sellers/admin/${id}/unflag/`);
  return fromApiSeller(data);
}

// ---------------------------------------------------------------------------
// Seller session — the JWT itself is stored under its own "sellerToken" key
// (services/api.js attaches it as the Bearer header for seller-only
// endpoints); this just caches the seller's profile so the dashboard
// doesn't need a round trip on every render.
// ---------------------------------------------------------------------------

export function setSellerSession(seller) {
  localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(seller));
}

export function getSellerSession() {
  try {
    const raw = localStorage.getItem(SELLER_SESSION_KEY);
    // A cached seller profile with no matching token is stale (e.g. left
    // over from a previous seller account on this browser) — treat it as
    // logged out rather than letting the dashboard render with the wrong
    // (or no) credentials attached to its requests.
    if (!raw || !localStorage.getItem("sellerToken")) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function clearSellerSession() {
  localStorage.removeItem(SELLER_SESSION_KEY);
  localStorage.removeItem("sellerToken");
}

// Refresh the current seller's own status/details (e.g. after an admin
// verifies them) using the token already attached by the api.js interceptor.
export async function getMySellerProfile() {
  const { data } = await api.get("/sellers/me/");
  return fromApiSeller(data);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

// Only products from verified sellers (or admin-added, seller-less products)
// — the backend already enforces this gating server-side.
export async function getStorefrontProducts() {
  const { data } = await api.get("/products/");
  return data.map(toUiProduct);
}

export async function getProductById(id) {
  const { data } = await api.get(`/products/id/${id}/`);
  return toUiProduct(data);
}

export async function getProductsBySeller(sellerId) {
  const { data } = await api.get("/sellers/me/products/");
  return data.map(toUiProduct);
}

// Used by the admin Sellers tab to view a specific seller's listings.
export async function getSellerProductsForAdmin(sellerId) {
  const { data } = await api.get(`/sellers/admin/${sellerId}/products/`);
  return data.map(toUiProduct);
}

export async function addSellerProduct(sellerId, data) {
  const { data: res } = await api.post("/sellers/me/products/", {
    name: data.title,
    category: data.category,
    description: data.description,
    price: Number(data.price),
    image: data.image,
    stock: Number(data.stock) || 0,
  });
  return toUiProduct(res);
}

export async function updateProduct(id, patch) {
  const payload = {};
  if (patch.price !== undefined) payload.price = Number(patch.price);
  if (patch.stock !== undefined) payload.stock = Number(patch.stock);
  if (patch.description !== undefined) payload.description = patch.description;
  const { data } = await api.patch(`/sellers/me/products/${id}/`, payload);
  return toUiProduct(data);
}

export async function deleteProduct(id) {
  await api.delete(`/sellers/me/products/${id}/`);
}

// ---------------------------------------------------------------------------
// Search + "similar category" suggestions — now server-side
// ---------------------------------------------------------------------------

export async function getSearchSuggestions(query) {
  if (!query.trim()) return { matches: [], related: [], relatedCategory: null };
  const { data } = await api.get("/products/search/", { params: { q: query } });
  return {
    matches: (data.matches || []).map(toUiProduct),
    related: (data.related || []).map(toUiProduct),
    relatedCategory: data.related_category || null,
  };
}

// ---------------------------------------------------------------------------
// Admin/SuperAdmin — product moderation
// ---------------------------------------------------------------------------

export async function getAllProductsAdmin(flaggedOnly) {
  const { data } = await api.get("/products/admin/", {
    params: flaggedOnly ? { flagged: "true" } : {},
  });
  return data.map(toUiProduct);
}

export async function flagProduct(id, reason) {
  const { data } = await api.post(`/products/admin/${id}/flag/`, { reason });
  return toUiProduct(data);
}

export async function unflagProduct(id) {
  const { data } = await api.post(`/products/admin/${id}/unflag/`);
  return toUiProduct(data);
}

// SuperAdmin only — permanent removal
export async function removeProductPermanently(id) {
  await api.delete(`/products/admin/${id}/remove/`);
}

// ---------------------------------------------------------------------------
// V4 Advanced Multi-Vendor: Bulk Upload, Payouts, Shipping & Admin Analytics
// ---------------------------------------------------------------------------

export async function uploadBulkCsvProducts(csvData) {
  const { data } = await api.post("/sellers/me/products/bulk-csv/", { csv_data: csvData });
  return data;
}

export async function getSellerReports() {
  const { data } = await api.get("/sellers/me/reports/");
  return data;
}

export async function getSellerPayouts() {
  const { data } = await api.get("/sellers/me/payouts/");
  return data;
}

export async function requestSellerPayout(amount, notes, bankDetails) {
  const { data } = await api.post("/sellers/me/payouts/", {
    amount: Number(amount),
    notes,
    bank_details: bankDetails,
  });
  return data;
}

export async function shipSellerOrder(orderId, carrier) {
  const { data } = await api.post(`/sellers/me/orders/${orderId}/ship/`, { carrier });
  return data;
}

export async function getMarketplaceAnalytics() {
  const { data } = await api.get("/sellers/admin/analytics/");
  return data;
}

export async function getAuditLogs() {
  const { data } = await api.get("/sellers/admin/audit-logs/");
  return data;
}

export async function processAdminPayout(payoutId, action) {
  const { data } = await api.post(`/sellers/admin/payouts/${payoutId}/process/`, { action });
  return data;
}
