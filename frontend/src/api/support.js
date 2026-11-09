import api from "../services/api";

function toUiQuery(q) {
  return {
    id: q.id,
    customerName: q.customer_name,
    customerEmail: q.customer_email,
    subject: q.subject,
    message: q.message,
    orderId: q.order_id || "",
    productId: q.product || null,
    productName: q.product_name || null,
    sellerId: q.seller || null,
    sellerName: q.seller_name || null,
    status: q.status,
    replies: (q.replies || []).map((r) => ({
      authorRole: r.author_role,
      authorName: r.author_name,
      message: r.message,
      createdAt: r.created_at,
    })),
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  };
}

// Customer: submit + view own queries
export async function submitQuery({ subject, message, orderId, productId }) {
  const { data } = await api.post("/support/queries/", {
    subject,
    message,
    order_id: orderId || "",
    product_id: productId || "",
  });
  return toUiQuery(data);
}

export async function getMyQueries() {
  const { data } = await api.get("/support/queries/");
  return data.map(toUiQuery);
}

// Seller: view + reply to queries about their products
export async function getSellerQueries() {
  const { data } = await api.get("/support/seller/queries/");
  return data.map(toUiQuery);
}

export async function replySellerQuery(id, message) {
  const { data } = await api.post(`/support/seller/queries/${id}/reply/`, { message });
  return toUiQuery(data);
}

// Admin: view all + reply/escalate/resolve
export async function getAdminQueries(statusFilter) {
  const { data } = await api.get("/support/admin/queries/", {
    params: statusFilter ? { status: statusFilter } : {},
  });
  return data.map(toUiQuery);
}

export async function replyAdminQuery(id, message, newStatus) {
  const { data } = await api.post(`/support/admin/queries/${id}/reply/`, {
    message: message || "",
    status: newStatus || undefined,
  });
  return toUiQuery(data);
}
