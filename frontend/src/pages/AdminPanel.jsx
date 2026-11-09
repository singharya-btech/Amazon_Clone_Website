import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate, Link } from "react-router-dom";
import { logoutAdmin } from "../services/authService";
import {
  getSellers,
  getSellerProductsForAdmin,
  verifySeller,
  flagSeller,
  unflagSeller,
  removeSeller,
  getAllProductsAdmin,
  flagProduct,
  unflagProduct,
  removeProductPermanently,
  getMarketplaceAnalytics,
  getAuditLogs,
  processAdminPayout,
} from "../mock/marketplace";
import {
  getCustomers,
  flagCustomer,
  unflagCustomer,
  removeCustomerPermanently,
} from "../api/customers";
import { getAdminQueries, replyAdminQuery } from "../api/support";

import "./Admin.css";

const promptReason = () => window.prompt("Reason for flagging this as fraud/suspicious?") || "";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("sellers");
  const [products, setProducts] = useState([]); // legacy quick-add products (this admin's own)
  const [admin, setAdmin] = useState(null);

  const [sellers, setSellers] = useState([]);
  const [sellerProductsMap, setSellerProductsMap] = useState({});

  const [allProducts, setAllProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [queries, setQueries] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loadError, setLoadError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const isSuperAdmin = !!admin?.is_superuser;

  const loadSellers = async () => {
    const list = await getSellers();
    setSellers(list);
    const entries = await Promise.all(
      list.map(async (s) => [s.id, await getSellerProductsForAdmin(s.id)])
    );
    setSellerProductsMap(Object.fromEntries(entries));
  };

  const loadAllProducts = async () => setAllProducts(await getAllProductsAdmin());
  const loadCustomers = async () => setCustomers(await getCustomers());
  const loadQueries = async () => setQueries(await getAdminQueries());
  const loadAnalytics = async () => {
    try {
      const res = await getMarketplaceAnalytics();
      setAnalytics(res);
    } catch (e) {
      console.error("Could not load marketplace analytics:", e);
    }
  };
  const loadAuditLogs = async () => {
    try {
      const res = await getAuditLogs();
      setAuditLogs(res);
    } catch (e) {
      console.error("Could not load audit logs:", e);
    }
  };

  useEffect(() => {
    const a = localStorage.getItem("adminUser");
    if (!a) {
      navigate("/admin/login");
      return;
    }
    setAdmin(JSON.parse(a));

    const stored = localStorage.getItem("products");
    const all = stored ? JSON.parse(stored) : [];
    const mine = all.filter((p) => p.owner === JSON.parse(a).username);
    setProducts(mine);

    (async () => {
      const results = await Promise.allSettled([
        loadSellers(),
        loadAllProducts(),
        loadCustomers(),
        loadQueries(),
      ]);
      const firstFailure = results.find((r) => r.status === "rejected");
      if (firstFailure) setLoadError(describeError(firstFailure.reason));
      else setLoadError("");
    })();
  }, [navigate]);

  const describeError = (err) => {
    if (err.response?.status === 403) {
      return "This account doesn't have Admin permissions on the backend (is_staff is False). If you registered before this fix, ask your backend to run: python manage.py shell -c \"from django.contrib.auth.models import User; User.objects.filter(username='YOUR_EMAIL').update(is_staff=True)\" — then log out and back in.";
    }
    return err.response?.data?.detail || err.response?.data || err.message || "Failed to load data.";
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this product?")) return;
    const stored = localStorage.getItem("products");
    const all = stored ? JSON.parse(stored) : [];
    const remaining = all.filter((p) => p.id !== id);
    localStorage.setItem("products", JSON.stringify(remaining));
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  // --- Sellers ---
  const handleVerify = async (id) => { await verifySeller(id); loadSellers(); };
  const handleFlagSeller = async (id) => {
    const reason = promptReason();
    await flagSeller(id, reason);
    loadSellers();
  };
  const handleUnflagSeller = async (id) => { await unflagSeller(id); loadSellers(); };
  const handleRemoveSeller = async (id, name) => {
    if (!window.confirm(`Permanently remove ${name} and everything they've listed?`)) return;
    await removeSeller(id);
    loadSellers();
  };

  // --- Products ---
  const handleFlagProduct = async (id) => {
    const reason = promptReason();
    await flagProduct(id, reason);
    loadAllProducts();
  };
  const handleUnflagProduct = async (id) => { await unflagProduct(id); loadAllProducts(); };
  const handleRemoveProduct = async (id, title) => {
    if (!window.confirm(`Permanently remove "${title}"?`)) return;
    await removeProductPermanently(id);
    loadAllProducts();
  };

  // --- Customers ---
  const handleFlagCustomer = async (userId) => {
    const reason = promptReason();
    await flagCustomer(userId, reason);
    loadCustomers();
  };
  const handleUnflagCustomer = async (userId) => { await unflagCustomer(userId); loadCustomers(); };
  const handleRemoveCustomer = async (userId, username) => {
    if (!window.confirm(`Permanently remove customer "${username}"?`)) return;
    await removeCustomerPermanently(userId);
    loadCustomers();
  };

  // --- Queries ---
  const handleReply = async (id, status) => {
    const message = replyDrafts[id] || "";
    await replyAdminQuery(id, message, status);
    setReplyDrafts({ ...replyDrafts, [id]: "" });
    loadQueries();
  };

  const grouped = {
    pending: sellers.filter((s) => s.status === "pending"),
    verified: sellers.filter((s) => s.status === "verified"),
    rejected: sellers.filter((s) => s.status === "rejected"),
  };

  const flaggedSellers = sellers.filter((s) => s.isFlagged);
  const flaggedProducts = allProducts.filter((p) => p.isFlagged);
  const flaggedCustomers = customers.filter((c) => c.isFlagged);

  return (
    <>
      <Header />
      <Navbar />

      <div className="adminPage">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: 12}}>
          <h1>{isSuperAdmin ? "SuperAdmin Panel" : "Admin Panel"}</h1>
          <div>
            <strong>{admin?.username}</strong>{" "}
            <span className={`stamp-badge ${isSuperAdmin ? "" : "pending"}`} style={{marginLeft: 8}}>
              {isSuperAdmin ? "SuperAdmin" : "Admin"}
            </span>
            <button style={{marginLeft:12}} onClick={() => navigate('/admin')}>Add Product</button>
            <button style={{marginLeft:12}} onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {loadError && (
          <div className="sellerForm__error" style={{ marginBottom: 16 }}>
            {loadError}
          </div>
        )}

        <div className="adminTabs">
          <button className={tab === "sellers" ? "active" : ""} onClick={() => setTab("sellers")}>Sellers ({sellers.length})</button>
          <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Products ({allProducts.length})</button>
          <button className={tab === "customers" ? "active" : ""} onClick={() => setTab("customers")}>Customers ({customers.length})</button>
          <button className={tab === "queries" ? "active" : ""} onClick={() => setTab("queries")}>Queries ({queries.length})</button>
          <button className={tab === "quickadd" ? "active" : ""} onClick={() => setTab("quickadd")}>My Quick-Add Products</button>
          <button className={tab === "analytics" ? "active" : ""} onClick={() => { setTab("analytics"); loadAnalytics(); }}>Marketplace Analytics</button>
          <button className={tab === "audit" ? "active" : ""} onClick={() => { setTab("audit"); loadAuditLogs(); }}>Security Audit Logs</button>
          {isSuperAdmin && (
            <button className={tab === "flagged" ? "active" : ""} onClick={() => setTab("flagged")}>
              🚩 Flagged ({flaggedSellers.length + flaggedProducts.length + flaggedCustomers.length})
            </button>
          )}
        </div>

        {!isSuperAdmin && (
          <p style={{fontSize: 13, color: "var(--text-muted)", marginBottom: 16}}>
            Regular Admin accounts can verify and flag suspicious sellers/products/customers. Only a SuperAdmin
            (a Django superuser) can permanently remove a flagged item.
          </p>
        )}

        {tab === "sellers" && (
          <div>
            {sellers.length === 0 ? (
              <div>No sellers have registered yet.</div>
            ) : (
              ["pending", "verified", "rejected"].map((status) =>
                grouped[status].length === 0 ? null : (
                  <div key={status} style={{ marginBottom: 28 }}>
                    <h3 style={{ marginBottom: 12, textTransform: "capitalize" }}>{status} ({grouped[status].length})</h3>
                    <div className="sellerReview__list">
                      {grouped[status].map((s) => {
                        const sellerProducts = sellerProductsMap[s.id] || [];
                        return (
                          <div className="sellerReview__card" key={s.id}>
                            <div className="sellerReview__top">
                              <div>
                                <h3>{s.businessName}</h3>
                                <div className="sellerReview__meta">{s.ownerName} · {s.email} · {s.phone}</div>
                                <div className="sellerReview__meta">
                                  Category: {s.categoryFocus} {s.registrationId && `· Reg. ID: ${s.registrationId}`}
                                </div>
                              </div>
                              <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
                                <span className={`stamp-badge ${s.status === "verified" ? "" : s.status}`}>{s.status}</span>
                                {s.isFlagged && <span className="stamp-badge rejected">🚩 flagged</span>}
                              </div>
                            </div>

                            <div className="sellerReview__desc">{s.businessDescription}</div>
                            {s.isFlagged && s.flagReason && (
                              <div className="sellerReview__desc" style={{borderColor:'var(--rust)', color:'var(--rust)'}}>
                                Flag reason: {s.flagReason}
                              </div>
                            )}

                            <div className="sellerReview__actions">
                              {s.status !== "verified" && (
                                <button className="verify" onClick={() => handleVerify(s.id)}>Mark as verified</button>
                              )}
                              {!s.isFlagged ? (
                                <button onClick={() => handleFlagSeller(s.id)}>🚩 Flag as fraud</button>
                              ) : (
                                <button onClick={() => handleUnflagSeller(s.id)}>Clear flag</button>
                              )}
                              {isSuperAdmin && (
                                <button className="remove" onClick={() => handleRemoveSeller(s.id, s.businessName)}>
                                  Remove seller (SuperAdmin)
                                </button>
                              )}
                            </div>

                            {sellerProducts.length > 0 && (
                              <div className="sellerReview__products">
                                {sellerProducts.map((p) => (
                                  <div className="sellerReview__productChip" key={p.id}>
                                    <strong>{p.title}</strong>
                                    ₹{p.price} · {p.category}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        )}

        {tab === "products" && (
          <div className="sellerReview__list">
            {allProducts.length === 0 ? (
              <div>No products yet.</div>
            ) : (
              allProducts.map((p) => (
                <div className="sellerReview__card" key={p.id}>
                  <div className="sellerReview__top">
                    <div>
                      <h3>{p.title}</h3>
                      <div className="sellerReview__meta">₹{p.price} · {p.category} {p.sellerName && `· sold by ${p.sellerName}`}</div>
                    </div>
                    {p.isFlagged && <span className="stamp-badge rejected">🚩 flagged</span>}
                  </div>
                  {p.isFlagged && p.flagReason && (
                    <div className="sellerReview__desc" style={{borderColor:'var(--rust)', color:'var(--rust)'}}>
                      Flag reason: {p.flagReason}
                    </div>
                  )}
                  <div className="sellerReview__actions">
                    {!p.isFlagged ? (
                      <button onClick={() => handleFlagProduct(p.id)}>🚩 Flag as fraud</button>
                    ) : (
                      <button onClick={() => handleUnflagProduct(p.id)}>Clear flag</button>
                    )}
                    {isSuperAdmin && (
                      <button className="remove" onClick={() => handleRemoveProduct(p.id, p.title)}>
                        Remove (SuperAdmin)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "customers" && (
          <div className="sellerReview__list">
            {customers.length === 0 ? (
              <div>No customers registered yet.</div>
            ) : (
              customers.map((c) => (
                <div className="sellerReview__card" key={c.id}>
                  <div className="sellerReview__top">
                    <div>
                      <h3>{c.username}</h3>
                      <div className="sellerReview__meta">{c.email} {c.firstName && `· ${c.firstName} ${c.lastName}`}</div>
                    </div>
                    {c.isFlagged && <span className="stamp-badge rejected">🚩 flagged</span>}
                  </div>
                  {c.isFlagged && c.flagReason && (
                    <div className="sellerReview__desc" style={{borderColor:'var(--rust)', color:'var(--rust)'}}>
                      Flag reason: {c.flagReason}
                    </div>
                  )}
                  <div className="sellerReview__actions">
                    {!c.isFlagged ? (
                      <button onClick={() => handleFlagCustomer(c.userId)}>🚩 Flag account</button>
                    ) : (
                      <button onClick={() => handleUnflagCustomer(c.userId)}>Clear flag</button>
                    )}
                    {isSuperAdmin && (
                      <button className="remove" onClick={() => handleRemoveCustomer(c.userId, c.username)}>
                        Remove (SuperAdmin)
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "queries" && (
          <div className="sellerReview__list">
            {queries.length === 0 ? (
              <div>No customer queries yet.</div>
            ) : (
              queries.map((q) => (
                <div className="sellerReview__card" key={q.id}>
                  <div className="sellerReview__top">
                    <div>
                      <h3>{q.subject}</h3>
                      <div className="sellerReview__meta">
                        {q.customerName} · {q.customerEmail}
                        {q.orderId && ` · Order: ${q.orderId}`}
                        {q.productName && ` · Product: ${q.productName}`}
                        {q.sellerName && ` · Seller: ${q.sellerName}`}
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
                      placeholder="Write a reply as admin..."
                      value={replyDrafts[q.id] || ""}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [q.id]: e.target.value })}
                      style={{ flex: 1, minWidth: 200, padding: 8, border: "1px solid var(--line)", borderRadius: 4 }}
                    />
                    <button onClick={() => handleReply(q.id, "replied")}>Reply</button>
                    <button onClick={() => handleReply(q.id, "escalated")}>Escalate</button>
                    <button onClick={() => handleReply(q.id, "resolved")}>Mark resolved</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "quickadd" && (
          <div style={{marginTop:16}}>
            {products.length === 0 ? (
              <div>No products yet. <Link to="/admin">Add one</Link></div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12}}>
                {products.map((p) => (
                  <div key={p.id} className="card" style={{padding:12}}>
                    <img src={p.image} alt={p.title} style={{width:'100%', height:140, objectFit:'cover', borderRadius:6}} />
                    <h3 style={{marginTop:8}}>{p.title}</h3>
                    <div>Price: ₹{p.price}</div>
                    <div>Category: {p.category}</div>
                    <div>Owner: {p.owner || 'unknown'}</div>
                    {p.owner === admin?.username && (
                      <div style={{marginTop:8}}>
                        <button onClick={() => navigate(`/admin/edit/${p.id}`)}>Edit</button>
                        <button style={{marginLeft:8}} onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "flagged" && isSuperAdmin && (
          <div>
            <h3 style={{marginBottom: 12}}>Flagged sellers ({flaggedSellers.length})</h3>
            <div className="sellerReview__list" style={{marginBottom: 28}}>
              {flaggedSellers.length === 0 ? <div>None right now.</div> : flaggedSellers.map((s) => (
                <div className="sellerReview__card" key={s.id}>
                  <div className="sellerReview__top">
                    <h3>{s.businessName}</h3>
                    <span className="stamp-badge rejected">🚩 flagged</span>
                  </div>
                  <div className="sellerReview__desc">Reason: {s.flagReason || "—"}</div>
                  <div className="sellerReview__actions">
                    <button onClick={() => handleUnflagSeller(s.id)}>Clear flag</button>
                    <button className="remove" onClick={() => handleRemoveSeller(s.id, s.businessName)}>Remove permanently</button>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{marginBottom: 12}}>Flagged products ({flaggedProducts.length})</h3>
            <div className="sellerReview__list" style={{marginBottom: 28}}>
              {flaggedProducts.length === 0 ? <div>None right now.</div> : flaggedProducts.map((p) => (
                <div className="sellerReview__card" key={p.id}>
                  <div className="sellerReview__top">
                    <h3>{p.title}</h3>
                    <span className="stamp-badge rejected">🚩 flagged</span>
                  </div>
                  <div className="sellerReview__desc">Reason: {p.flagReason || "—"}</div>
                  <div className="sellerReview__actions">
                    <button onClick={() => handleUnflagProduct(p.id)}>Clear flag</button>
                    <button className="remove" onClick={() => handleRemoveProduct(p.id, p.title)}>Remove permanently</button>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{marginBottom: 12}}>Flagged customers ({flaggedCustomers.length})</h3>
            <div className="sellerReview__list">
              {flaggedCustomers.length === 0 ? <div>None right now.</div> : flaggedCustomers.map((c) => (
                <div className="sellerReview__card" key={c.id}>
                  <div className="sellerReview__top">
                    <h3>{c.username}</h3>
                    <span className="stamp-badge rejected">🚩 flagged</span>
                  </div>
                  <div className="sellerReview__desc">Reason: {c.flagReason || "—"}</div>
                  <div className="sellerReview__actions">
                    <button onClick={() => handleUnflagCustomer(c.userId)}>Clear flag</button>
                    <button className="remove" onClick={() => handleRemoveCustomer(c.userId, c.username)}>Remove permanently</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ marginBottom: 16 }}>Enterprise Marketplace Overview</h2>
            {analytics ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Gross Merchandise Value (GMV)</div>
                  <div style={{ fontSize: 26, fontWeight: "bold", color: "#111" }}>₹{analytics.total_gmv}</div>
                </div>
                <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Platform Commission (10%)</div>
                  <div style={{ fontSize: 26, fontWeight: "bold", color: "#007600" }}>₹{analytics.estimated_commission}</div>
                </div>
                <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Orders Completed</div>
                  <div style={{ fontSize: 26, fontWeight: "bold", color: "#111" }}>{analytics.total_orders}</div>
                </div>
                <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Active Registered Sellers</div>
                  <div style={{ fontSize: 26, fontWeight: "bold", color: "#111" }}>
                    {analytics.total_sellers} <span style={{ fontSize: 13, color: "green" }}>({analytics.verified_sellers} verified)</span>
                  </div>
                </div>
                <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Marketplace Catalog SKUs</div>
                  <div style={{ fontSize: 26, fontWeight: "bold", color: "#111" }}>{analytics.total_products}</div>
                </div>
                <div style={{ background: "#fff3cd", padding: 20, borderRadius: 6, border: "1px solid #ffeeba" }}>
                  <div style={{ fontSize: 13, color: "#856404" }}>Pending Seller Payouts</div>
                  <div style={{ fontSize: 26, fontWeight: "bold", color: "#856404" }}>{analytics.pending_payouts}</div>
                </div>
              </div>
            ) : (
              <div>Loading analytics data...</div>
            )}
          </div>
        )}

        {tab === "audit" && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ marginBottom: 16 }}>Marketplace Security & Audit Trail</h2>
            {auditLogs.length === 0 ? (
              <div>No audit logs recorded yet.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff", border: "1px solid var(--line)" }}>
                  <thead>
                    <tr style={{ background: "#f1f3f5", borderBottom: "2px solid var(--line)", textAlign: "left" }}>
                      <th style={{ padding: 10 }}>Timestamp</th>
                      <th style={{ padding: 10 }}>User</th>
                      <th style={{ padding: 10 }}>Role</th>
                      <th style={{ padding: 10 }}>Action</th>
                      <th style={{ padding: 10 }}>Resource</th>
                      <th style={{ padding: 10 }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: 10, color: "var(--text-muted)" }}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={{ padding: 10, fontWeight: "bold" }}>{log.username}</td>
                        <td style={{ padding: 10 }}>
                          <span className={`stamp-badge ${log.role === "admin" ? "" : "pending"}`}>{log.role}</span>
                        </td>
                        <td style={{ padding: 10, fontFamily: "monospace" }}>{log.action}</td>
                        <td style={{ padding: 10 }}>{log.resource_type} #{log.resource_id}</td>
                        <td style={{ padding: 10, color: "var(--text-muted)" }}>{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default AdminPanel;
