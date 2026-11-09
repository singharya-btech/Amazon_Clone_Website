import api from "./api";

// Products CRUD & Query
export const getProducts = async (filters = {}) => {
  const response = await api.get("/v1/products/", { params: filters });
  return response.data;
};

export const getProductById = async (slug) => {
  const response = await api.get(`/v1/products/${slug}/`);
  return response.data;
};

export const searchProducts = async (keyword) => {
  const response = await api.get("/v1/products/", { params: { search: keyword } });
  return response.data;
};

export const getFeaturedProducts = async () => {
  const response = await api.get("/v1/products/featured/");
  return response.data;
};

// V3 Advanced Features
export const compareProducts = async (ids) => {
  const idsStr = Array.isArray(ids) ? ids.join(",") : ids;
  const response = await api.get(`/v1/products/compare/?ids=${idsStr}`);
  return response.data;
};

export const getRecommendations = async (productId) => {
  const response = await api.get(`/v1/products/${productId}/recommendations/`);
  return response.data;
};

export const getFrequentlyBoughtTogether = async (productId) => {
  const response = await api.get(`/v1/products/${productId}/frequently-bought-together/`);
  return response.data;
};

export const getRelatedProducts = async (productId) => {
  const response = await api.get(`/v1/products/${productId}/related/`);
  return response.data;
};

export const getAutocompleteSuggestions = async (query) => {
  const response = await api.get(`/v1/products/autocomplete/?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getSearchHistory = async () => {
  const response = await api.get("/v1/search/history/");
  return response.data;
};

export const addSearchHistory = async (query) => {
  const response = await api.post("/v1/search/history/", { query });
  return response.data;
};

export const clearSearchHistory = async () => {
  const response = await api.delete("/v1/search/history/");
  return response.data;
};

export const getProductQA = async (productId) => {
  const response = await api.get(`/v1/products/${productId}/qa/`);
  return response.data;
};

export const askProductQuestion = async (productId, question_text) => {
  const response = await api.post(`/v1/products/${productId}/qa/questions/`, { question_text });
  return response.data;
};

export const answerProductQuestion = async (questionId, answer_text) => {
  const response = await api.post(`/v1/products/qa/questions/${questionId}/answers/`, { answer_text });
  return response.data;
};

export const subscribeBackInStock = async (productId, email) => {
  const response = await api.post(`/v1/products/${productId}/notify-stock/`, { email });
  return response.data;
};

export const getActiveFlashSales = async () => {
  const response = await api.get("/v1/flash-sales/active/");
  return response.data;
};


export const createProduct = async (productData) => {
  const response = await api.post("/v1/products/", productData);
  return response.data;
};

export const deleteProduct = async (slug) => {
  const response = await api.delete(`/v1/products/${slug}/`);
  return response.data;
};
