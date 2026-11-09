import api from "../services/api";

function toUiCustomer(c) {
  return {
    id: c.id,
    userId: c.user_id,
    username: c.username,
    email: c.email,
    firstName: c.first_name || "",
    lastName: c.last_name || "",
    isFlagged: !!c.is_flagged,
    flagReason: c.flag_reason || "",
    createdAt: c.created_at,
  };
}

export async function getCustomers(flaggedOnly) {
  const { data } = await api.get("/auth/admin/customers/", {
    params: flaggedOnly ? { flagged: "true" } : {},
  });
  return data.map(toUiCustomer);
}

export async function flagCustomer(userId, reason) {
  const { data } = await api.post(`/auth/admin/customers/${userId}/flag/`, { reason });
  return toUiCustomer(data);
}

export async function unflagCustomer(userId) {
  const { data } = await api.post(`/auth/admin/customers/${userId}/unflag/`);
  return toUiCustomer(data);
}

// SuperAdmin only — permanent removal
export async function removeCustomerPermanently(userId) {
  await api.delete(`/auth/superadmin/customers/${userId}/`);
}
