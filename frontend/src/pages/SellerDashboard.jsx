import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SellerDashboard.css";
import {
  getSellerSession,
  clearSellerSession,
  getMySellerProfile,
  getProductsBySeller,
  addSellerProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
  uploadBulkCsvProducts,
  getSellerReports,
  getSellerPayouts,
  requestSellerPayout,
  shipSellerOrder,
} from "../mock/marketplace";
import { getSellerQueries, replySellerQuery } from "../api/support";
import { getSellerReviews, replySellerReview } from "../api/reviews";
import { getSellerOrders, updateSellerOrderItemStatus } from "../services/orderService";

const STATUS_COPY = {
  pending: {
    title: "Your account is pending review",
    body:
      "An admin is checking your business details. You can add products now — they'll go live on the storefront automatically as soon as you're verified.",
  },
  verified: {
    title: "You're a verified seller",
    body: "Your products are live and visible to every Amazon Clone customer.",
  },
  rejected: {
    title: "Your application was not approved",
    body:
      "Your products won't appear to customers. Contact support if you'd like to update your details and re-apply.",
  },
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ price: "", stock: "", description: "" });
  const [activeTab, setActiveTab] = useState("products");
  const [queries, setQueries] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [orders, setOrders] = useState([]);
  const [orderError, setOrderError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewReplyDrafts, setReviewReplyDrafts] = useState({});

  const [reports, setReports] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payoutMessage, setPayoutMessage] = useState("");
  const [csvText, setCsvText] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    image: "",
  });

  const refresh = async (sellerId) => {
    const [prods, cats] = await Promise.all([getProductsBySeller(sellerId), getCategories()]);
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => {
    const session = getSellerSession();
    if (!session) {
      navigate("/seller/login");
      return;
    }
    (async () => {
      // pull the freshest copy in case an admin changed the status
      let fresh = session;
      try {
        fresh = await getMySellerProfile();
      } catch (e) {
        if (e.response?.status === 401 || e.response?.status === 403) {
          // The cached seller profile doesn't match a valid seller session
          // (e.g. this browser is currently logged in as a different
          // account) — don't render a dashboard with data that isn't
          // really this seller's. Send them back to log in properly.
          clearSellerSession();
          navigate("/seller/login");
          return;
        }
        // Some other (e.g. network) error — fall back to the cached session.
      }
      setSeller(fresh);
      const cats = await getCategories();
      setCategories(cats);
      setForm((f) => ({ ...f, category: cats[0] || "" }));
      const prods = await getProductsBySeller(fresh.id);
      setProducts(prods);
      try {
        setQueries(await getSellerQueries());
      } catch (e) {
        console.error("Could not load seller queries:", e.response?.data || e.message);
      }
      try {
        setOrders(await getSellerOrders());
      } catch (e) {
        const msg = e.response?.data?.detail || e.message || "Could not load your orders.";
        setOrderError(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      try {
        setReviews(await getSellerReviews());
      } catch (e) {
        console.error("Could not load seller reviews:", e.response?.data || e.message);
      }
    })();
  }, [navigate]);

  const handleLogout = () => {
    clearSellerSession();
    navigate("/seller/login");
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const updated = await addCategory(newCategory.trim(), categories);
    setCategories(updated);
    setForm((f) => ({ ...f, category: newCategory.trim() }));
    setNewCategory("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title || !form.price || !form.category) {
      setError("Title, price, and category are required.");
      return;
    }

    try {
      await addSellerProduct(seller.id, form);
      await refresh(seller.id);
      setForm({
        title: "",
        price: "",
        stock: "",
        category: categories[0] || "",
        description: "",
        image: "",
      });
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data || err.message || "Could not add product.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this product from your storefront?")) return;
    await deleteProduct(id);
    await refresh(seller.id);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditValues({ price: p.price, stock: p.stock, description: p.description || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    await updateProduct(id, {
      price: Number(editValues.price),
      stock: Number(editValues.stock),
      description: editValues.description,
    });
    setEditingId(null);
    await refresh(seller.id);
  };

  const handleReplyToQuery = async (id) => {
    const message = (replyDrafts[id] || "").trim();
    if (!message) return;
    await replySellerQuery(id, message);
    setReplyDrafts({ ...replyDrafts, [id]: "" });
    setQueries(await getSellerQueries());
  };

  const handleUpdateOrderItemStatus = async (orderId, productId, itemStatus) => {
    setOrderError("");
    try {
      await updateSellerOrderItemStatus(orderId, productId, itemStatus);
      setOrders(await getSellerOrders());
    } catch (err) {
      const message = err.response?.data?.detail || err.message || "Could not update order status.";
      setOrderError(typeof message === "string" ? message : JSON.stringify(message));
    }
  };

  const handleReplyToReview = async (id) => {
    const message = (reviewReplyDrafts[id] || "").trim();
    if (!message) return;
    await replySellerReview(id, message);
    setReviewReplyDrafts({ ...reviewReplyDrafts, [id]: "" });
    setReviews(await getSellerReviews());
  };

  const loadReportsAndPayouts = async () => {
    try {
      const rep = await getSellerReports();
      setReports(rep);
      const pay = await getSellerPayouts();
      setPayouts(pay);
    } catch (e) {
      console.error("Could not load reports/payouts:", e.response?.data || e.message);
    }
  };

  const handleBulkCsv = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setError("");
    setCsvSuccess("");
    try {
      const res = await uploadBulkCsvProducts(csvText);
      setCsvSuccess(`Successfully added ${res.created_count} product(s) via bulk CSV!`);
      setCsvText("");
      if (seller) await refresh(seller.id);
    } catch (err) {
      setError(err.response?.data?.error || "Bulk upload failed.");
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0) return;
    setPayoutMessage("");
    try {
      await requestSellerPayout(payoutAmount, payoutNotes);
      setPayoutMessage("Payout request submitted successfully!");
      setPayoutAmount("");
      setPayoutNotes("");
      await loadReportsAndPayouts();
      const fresh = await getMySellerProfile();
      setSeller(fresh);
    } catch (err) {
      setPayoutMessage(err.response?.data?.error || "Payout request failed.");
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
      const res = await shipSellerOrder(orderId, "Delhivery Express");
      alert(`Order marked as shipped! Tracking: ${res.tracking_number} (${res.carrier})`);
      setOrders(await getSellerOrders());
    } catch (err) {
      alert(err.response?.data?.error || "Failed to mark order shipped.");
    }
  };

  if (!seller) return null;

  const statusCopy = STATUS_COPY[seller.status] || STATUS_COPY.pending;

  return (
    <div className="sellerDash">
      <div className="sellerDash__header">
        <div className="container">
          <div>
            <h1>{seller.businessName}</h1>
            <p>{seller.email} · {seller.categoryFocus}</p>
          </div>
          <button className="sellerDash__logout" onClick={handleLogout}>Sign out</button>
        </div>
      </div>

      <div className="container">
        <div className={`sellerDash__banner ${seller.status}`}>
          <div>
            <strong>{statusCopy.title}</strong>
            <span>{statusCopy.body}</span>
          </div>
          <span className={`stamp-badge ${seller.status === "verified" ? "" : seller.status}`}>
            {seller.status}
          </span>
        </div>

        <div className="adminTabs">
          <button className={activeTab === "products" ? "active" : ""} onClick={() => setActiveTab("products")}>
            Products
          </button>
          <button className={activeTab === "queries" ? "active" : ""} onClick={() => setActiveTab("queries")}>
            Customer Queries ({queries.length})
          </button>
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>
            Orders ({orders.length})
          </button>
          <button className={activeTab === "reviews" ? "active" : ""} onClick={() => setActiveTab("reviews")}>
            Reviews ({reviews.length})
          </button>
          <button className={activeTab === "reports" ? "active" : ""} onClick={() => { setActiveTab("reports"); loadReportsAndPayouts(); }}>
            Reports & Payouts
          </button>
        </div>

        {activeTab === "products" && (
        <div className="sellerDash__grid">
          <div className="sellerDash__panel">
            <h3>Add a product</h3>
            <form className="sellerProductForm" onSubmit={handleSubmit}>
              <label>Product name</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <label>Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />

              <label>Stock quantity</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />

              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div className="newCategoryRow">
                <input
                  placeholder="Or create a new category (e.g. Toys)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button type="button" onClick={handleAddCategory}>Add</button>
              </div>

              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <label>Product image</label>
              <input type="file" accept="image/*" onChange={handleImage} />
              {form.image && <img className="preview" src={form.image} alt="preview" />}

              {error && <div className="sellerForm__error">{error}</div>}

              <button type="submit">Add product</button>
            </form>

            <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
              <h4>Bulk CSV Product Upload</h4>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                Format: <code>name,price,stock,category,description</code> (one per line)
              </p>
              <textarea
                placeholder="Wireless Earbuds,2999,20,Audio,Active Noise Cancellation..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: 8, fontSize: 12, fontFamily: "monospace", borderRadius: 4, border: "1px solid var(--line)" }}
              />
              {csvSuccess && <div style={{ color: "green", fontSize: 13, marginTop: 4 }}>{csvSuccess}</div>}
              <button
                type="button"
                onClick={handleBulkCsv}
                style={{ marginTop: 8, background: "#232f3e", color: "#fff", padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}
              >
                Upload CSV Products
              </button>
            </div>
          </div>

          <div className="sellerDash__panel">
            <h3>My products ({products.length})</h3>
            {products.length === 0 ? (
              <div className="sellerDash__empty">
                You haven't added any products yet. Use the form to list your first one.
              </div>
            ) : (
              <div className="sellerProducts__list">
                {products.map((p) => (
                  <div className="sellerProductCard" key={p.id}>
                    {p.image ? (
                      <img src={p.image} alt={p.title} />
                    ) : (
                      <div style={{ height: 140, background: "var(--paper)" }} />
                    )}
                    <div className="sellerProductCard__body">
                      <h4>{p.title}</h4>

                      {editingId === p.id ? (
                        <>
                          <label style={{ fontSize: 12 }}>Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValues.price}
                            onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                            style={{ width: "100%", marginBottom: 6, padding: 6, border: "1px solid var(--line)", borderRadius: 4 }}
                          />
                          <label style={{ fontSize: 12 }}>Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={editValues.stock}
                            onChange={(e) => setEditValues({ ...editValues, stock: e.target.value })}
                            style={{ width: "100%", marginBottom: 6, padding: 6, border: "1px solid var(--line)", borderRadius: 4 }}
                          />
                          <label style={{ fontSize: 12 }}>Description</label>
                          <textarea
                            value={editValues.description}
                            onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                            style={{ width: "100%", marginBottom: 8, padding: 6, border: "1px solid var(--line)", borderRadius: 4, minHeight: 50 }}
                          />
                          <div className="sellerProductCard__actions">
                            <button onClick={() => saveEdit(p.id)}>Save</button>
                            <button onClick={cancelEdit}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="sellerProductCard__meta">
                            <span>₹{p.price}</span>
                            <span>{p.category}</span>
                          </div>
                          <div className="sellerProductCard__actions">
                            <button onClick={() => startEdit(p)}>Edit</button>
                            <button className="danger" onClick={() => handleDelete(p.id)}>Remove</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {activeTab === "queries" && (
          <div className="sellerDash__panel" style={{ marginBottom: 60 }}>
            <h3>Customer queries about your products</h3>
            {queries.length === 0 ? (
              <div className="sellerDash__empty">No customer queries yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {queries.map((q) => (
                  <div key={q.id} className="sellerReview__card">
                    <div className="sellerReview__top">
                      <div>
                        <h3>{q.subject}</h3>
                        <div className="sellerReview__meta">
                          {q.customerName} · {q.customerEmail}
                          {q.orderId && ` · Order: ${q.orderId}`}
                          {q.productName && ` · Product: ${q.productName}`}
                        </div>
                      </div>
                      <span className={`stamp-badge ${q.status === "resolved" ? "" : q.status === "escalated" ? "rejected" : "pending"}`}>
                        {q.status}
                      </span>
                    </div>

                    <div className="sellerReview__desc">{q.message}</div>

                    {q.replies.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        {q.replies.map((r, i) => (
                          <div key={i} className="sellerReview__desc" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                            <strong style={{ textTransform: "capitalize" }}>{r.authorRole}</strong> ({r.authorName}): {r.message}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        placeholder="Write a reply to this customer..."
                        value={replyDrafts[q.id] || ""}
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [q.id]: e.target.value })}
                        style={{ flex: 1, minWidth: 200, padding: 8, border: "1px solid var(--line)", borderRadius: 4 }}
                      />
                      <button onClick={() => handleReplyToQuery(q.id)}>Reply</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "orders" && (
          <div className="sellerDash__panel" style={{ marginBottom: 60 }}>
            <h3>Orders containing your products</h3>
            {orderError && <div className="sellerForm__error">{orderError}</div>}
            {orders.length === 0 ? (
              <div className="sellerDash__empty">No orders yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {orders.map((o) => {
                  const myItems = (o.items || []).filter((it) => it.seller_id === seller.id);
                  return (
                    <div key={o.id} className="sellerReview__card">
                      <div className="sellerReview__top">
                        <div>
                          <h3>Order #{o.id}</h3>
                          <div className="sellerReview__meta">
                            {o.full_name} · {o.email} · {o.phone}
                            <br />
                            {o.address}, {o.city}, {o.state} {o.zip_code}, {o.country}
                          </div>
                        </div>
                        <span className={`stamp-badge ${o.status === "delivered" ? "" : o.status === "cancelled" ? "rejected" : "pending"}`}>
                          {o.status}
                        </span>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                        {myItems.map((it) => (
                          <div
                            key={it.product_id}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              gap: 12, flexWrap: "wrap", padding: 10,
                              border: "1px solid var(--line)", borderRadius: 4,
                            }}
                          >
                            <div>
                              <strong>{it.product_name}</strong> · Qty {it.quantity} · ₹{it.subtotal}
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <select
                                value={it.item_status || "pending"}
                                onChange={(e) => handleUpdateOrderItemStatus(o.id, it.product_id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {it.item_status !== "shipped" && it.item_status !== "delivered" && (
                                <button
                                  type="button"
                                  onClick={() => handleShipOrder(o.id)}
                                  style={{ background: "#f08804", color: "#111", padding: "4px 8px", fontSize: 12, borderRadius: 3, border: "none", cursor: "pointer", fontWeight: "bold" }}
                                >
                                  Ship via Delhivery
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="sellerDash__panel" style={{ marginBottom: 60 }}>
            <h3>Reviews on your products</h3>
            {reviews.length === 0 ? (
              <div className="sellerDash__empty">No reviews yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {reviews.map((r) => (
                  <div key={r.id} className="sellerReview__card">
                    <div className="sellerReview__top">
                      <div>
                        <h3>{r.productName}</h3>
                        <div className="sellerReview__meta">
                          {r.customerName} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </div>
                      </div>
                    </div>

                    {r.comment && <div className="sellerReview__desc">{r.comment}</div>}

                    {r.replies.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        {r.replies.map((reply, i) => (
                          <div key={i} className="sellerReview__desc" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                            <strong style={{ textTransform: "capitalize" }}>{reply.authorRole}</strong> ({reply.authorName}): {reply.message}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        placeholder="Write a reply to this review..."
                        value={reviewReplyDrafts[r.id] || ""}
                        onChange={(e) => setReviewReplyDrafts({ ...reviewReplyDrafts, [r.id]: e.target.value })}
                        style={{ flex: 1, minWidth: 200, padding: 8, border: "1px solid var(--line)", borderRadius: 4 }}
                      />
                      <button onClick={() => handleReplyToReview(r.id)}>Reply</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="sellerDash__panel" style={{ marginBottom: 60 }}>
            <h3>Financial Reports & Payout Management</h3>

            {reports ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "var(--surface)", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Gross Sales</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "#111" }}>₹{reports.gross_sales}</div>
                </div>
                <div style={{ background: "var(--surface)", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Units Sold</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "#111" }}>{reports.units_sold}</div>
                </div>
                <div style={{ background: "var(--surface)", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Commission Paid ({reports.commission_rate}%)</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "var(--rust)" }}>₹{reports.total_commission_paid}</div>
                </div>
                <div style={{ background: "var(--surface)", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Net Earnings</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "green" }}>₹{reports.net_earnings}</div>
                </div>
                <div style={{ background: "#e8f4fd", padding: 16, borderRadius: 6, border: "1px solid #b6d4fe" }}>
                  <div style={{ fontSize: 13, color: "#004085" }}>Available Balance</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: "#004085" }}>₹{reports.available_balance?.toFixed(2)}</div>
                </div>
              </div>
            ) : (
              <div>Loading financial reports...</div>
            )}

            <div style={{ background: "var(--surface)", padding: 20, borderRadius: 6, border: "1px solid var(--line)", marginBottom: 24 }}>
              <h4>Request Payout / Withdrawal</h4>
              {payoutMessage && (
                <div style={{ padding: 8, marginBottom: 12, borderRadius: 4, background: payoutMessage.includes("success") ? "#d4edda" : "#f8d7da", color: payoutMessage.includes("success") ? "#155724" : "#721c24" }}>
                  {payoutMessage}
                </div>
              )}
              <form onSubmit={handleRequestPayout} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Amount (₹)</label>
                  <input
                    type="number"
                    min="100"
                    step="1"
                    placeholder="e.g. 5000"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    style={{ padding: 8, border: "1px solid var(--line)", borderRadius: 4, width: 160 }}
                    required
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Notes / Withdrawal Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly vendor payout request"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    style={{ padding: 8, border: "1px solid var(--line)", borderRadius: 4, width: "100%" }}
                  />
                </div>
                <button type="submit" style={{ background: "#febd69", color: "#111", padding: "9px 18px", border: "none", borderRadius: 4, fontWeight: "bold", cursor: "pointer" }}>
                  Request Payout
                </button>
              </form>
            </div>

            <h4>Payout History</h4>
            {payouts.length === 0 ? (
              <div className="sellerDash__empty">No payouts requested yet.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 12 }}>
                <thead>
                  <tr style={{ background: "var(--surface)", borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                    <th style={{ padding: 10 }}>ID</th>
                    <th style={{ padding: 10 }}>Amount</th>
                    <th style={{ padding: 10 }}>Status</th>
                    <th style={{ padding: 10 }}>Requested At</th>
                    <th style={{ padding: 10 }}>Processed At</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: 10 }}>#{p.id}</td>
                      <td style={{ padding: 10, fontWeight: "bold" }}>₹{p.amount}</td>
                      <td style={{ padding: 10 }}>
                        <span className={`stamp-badge ${p.status === "processed" ? "verified" : p.status === "rejected" ? "rejected" : "pending"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: 10 }}>{new Date(p.requested_at).toLocaleDateString()}</td>
                      <td style={{ padding: 10 }}>{p.processed_at ? new Date(p.processed_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
