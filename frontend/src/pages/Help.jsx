import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { submitQuery, getMyQueries } from "../api/support";
import { getOrders } from "../services/orderService";
import "./Seller.css";
import "./Help.css";

const Help = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: "", message: "", orderId: "", productId: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setQueries(await getMyQueries());
    } catch (e) {
      // if not logged in, this will fail — handled by the gate below
    }
    try {
      setMyOrders(await getOrders());
    } catch (e) {
      // non-fatal — the order/product pickers just show no options
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      await submitQuery(form);
      setForm({ subject: "", message: "", orderId: "", productId: "" });
      await load();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || err.message || "Could not submit your query.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    setSubmitting(false);
  };

  // Products the customer can actually pick, so they never have to guess a
  // raw ID. If an order is selected, only that order's items are offered;
  // otherwise every product across all their orders is offered.
  const selectedOrder = myOrders.find((o) => String(o.id) === String(form.orderId));
  const productOptions = (selectedOrder ? selectedOrder.items : myOrders.flatMap((o) => o.items)).reduce(
    (unique, item) => {
      if (!unique.some((p) => String(p.product_id) === String(item.product_id))) {
        unique.push(item);
      }
      return unique;
    },
    []
  );

  if (!user) {
    return (
      <>
        <Header />
        <Navbar />
        <div className="help">
          <h1>Help &amp; Support</h1>
          <p>Please <Link to="/login">sign in</Link> to submit a query or see your past questions.</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Navbar />

      <div className="help">
        <h1>Help &amp; Support</h1>
        <p className="help__intro">
          Have a problem with an order or a product, or just a general question? Send it here —
          the seller sees it first, and our team can step in too.
        </p>

        <div className="help__grid">
          <div className="help__panel">
            <h3>Submit a query</h3>
            <form className="sellerForm" onSubmit={handleSubmit}>
              <label>Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Item arrived damaged"
                required
              />

              <label>Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us what's going on..."
                required
              />

              <label>Order (optional)</label>
              <select
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value, productId: "" })}
                style={{ width: "100%", marginBottom: 6, padding: 6, border: "1px solid var(--line)", borderRadius: 4 }}
              >
                <option value="">General question — not tied to an order</option>
                {myOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order #{o.id} · {new Date(o.created_at).toLocaleDateString()} · {o.status}
                  </option>
                ))}
              </select>

              <label>Product (optional)</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                style={{ width: "100%", marginBottom: 6, padding: 6, border: "1px solid var(--line)", borderRadius: 4 }}
                disabled={productOptions.length === 0}
              >
                <option value="">
                  {productOptions.length === 0 ? "No purchased products to select" : "General question — not about a specific product"}
                </option>
                {productOptions.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name}
                  </option>
                ))}
              </select>

              {error && <div className="sellerForm__error">{error}</div>}

              <button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send query"}
              </button>
            </form>
          </div>

          <div className="help__panel">
            <h3>Your past queries</h3>
            {loading ? (
              <div className="sellerDash__empty">Loading…</div>
            ) : queries.length === 0 ? (
              <div className="sellerDash__empty">You haven't sent any queries yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {queries.map((q) => (
                  <div key={q.id} className="sellerReview__card">
                    <div className="sellerReview__top">
                      <h3>{q.subject}</h3>
                      <span className={`stamp-badge ${q.status === "resolved" ? "" : q.status === "escalated" ? "rejected" : "pending"}`}>
                        {q.status}
                      </span>
                    </div>
                    <div className="sellerReview__desc">{q.message}</div>
                    {q.replies.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        {q.replies.map((r, i) => (
                          <div key={i} className="sellerReview__desc" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                            <strong style={{ textTransform: "capitalize" }}>{r.authorRole}</strong>: {r.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Help;
