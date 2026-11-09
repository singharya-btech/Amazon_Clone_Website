import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  getOrders,
  cancelOrder,
  returnOrder,
  reorderOrder,
  getInvoiceUrl,
} from "../services/orderService";

const Orders = () => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [returnModal, setReturnModal] = useState({ open: false, orderId: null, reason: "" });
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, reason: "" });

  const fetchOrderList = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const data = await getOrders();
        setOrders(data || []);
      } else {
        const stored = localStorage.getItem("orders");
        setOrders(stored ? JSON.parse(stored) : []);
      }
    } catch (e) {
      console.warn("Could not fetch server orders, falling back to local.", e);
      const stored = localStorage.getItem("orders");
      setOrders(stored ? JSON.parse(stored) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderList();
  }, [isAuthenticated]);

  const handleCancel = async () => {
    if (!cancelModal.orderId) return;
    try {
      setActionLoading(cancelModal.orderId);
      await cancelOrder(cancelModal.orderId, cancelModal.reason || "Customer cancelled");
      setCancelModal({ open: false, orderId: null, reason: "" });
      fetchOrderList();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel order.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async () => {
    if (!returnModal.orderId || !returnModal.reason.trim()) {
      alert("Please provide a reason for the return.");
      return;
    }
    try {
      setActionLoading(returnModal.orderId);
      await returnOrder(returnModal.orderId, returnModal.reason);
      setReturnModal({ open: false, orderId: null, reason: "" });
      fetchOrderList();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to request return.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReorder = async (order) => {
    try {
      setActionLoading(order.id);
      if (isAuthenticated) {
        await reorderOrder(order.id);
      } else {
        (order.items || []).forEach((item) => {
          addToCart({
            id: item.product_id,
            name: item.product_name,
            price: item.product_price,
            image: item.product_image,
            quantity: item.quantity || 1,
          });
        });
      }
      navigate("/cart");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reorder items.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["pending", "processing"].includes(o.status?.toLowerCase());
    if (activeTab === "delivered") return o.status?.toLowerCase() === "delivered";
    if (activeTab === "cancelled") return ["cancelled", "refunded", "return_requested"].includes(o.status?.toLowerCase());
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Orders</h1>
            <p className="text-xs text-gray-500 mt-1">
              Track packages, request returns, download tax invoices, and reorder past purchases.
            </p>
          </div>
          <Link
            to="/shop"
            className="mt-4 sm:mt-0 text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            &larr; Continue Shopping
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-4 border-b border-gray-200 mb-6 text-sm">
          {[
            { id: "all", label: "All Orders" },
            { id: "pending", label: "Open Orders" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled & Returns" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-amber-500 text-amber-600 font-bold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading your orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't placed any orders in this category yet.
            </p>
            <Link
              to="/shop"
              className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded shadow transition"
            >
              Browse Deals
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const statusLower = (order.status || "pending").toLowerCase();
              const canCancel = order.can_cancel ?? ["pending", "processing"].includes(statusLower);
              const canReturn = order.can_return ?? statusLower === "delivered";

              return (
                <div key={order.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-gray-50 p-4 sm:px-6 flex flex-wrap justify-between items-center text-xs text-gray-600 gap-4 border-b">
                    <div className="flex gap-6 sm:gap-10">
                      <div>
                        <span className="block uppercase tracking-wider text-gray-400 font-semibold">ORDER PLACED</span>
                        <span className="font-medium text-gray-800">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : order.date || "Recent"}
                        </span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider text-gray-400 font-semibold">TOTAL</span>
                        <span className="font-bold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block uppercase tracking-wider text-gray-400 font-semibold">SHIP TO</span>
                        <span className="font-medium text-gray-800">{order.full_name || "Customer"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-500">ORDER # {order.id}</span>
                      <a
                        href={getInvoiceUrl(order.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Tax Invoice 📄
                      </a>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      {/* Status Badge & History */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            statusLower === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                            statusLower === 'cancelled' || statusLower === 'refunded' ? 'bg-red-100 text-red-800' :
                            statusLower === 'return_requested' ? 'bg-orange-100 text-orange-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            Payment: {order.payment_method?.toUpperCase() || "COD"} ({order.payment_status || "PENDING"})
                          </span>
                        </div>

                        {/* Status History preview */}
                        {order.history && order.history.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                            {order.history.map((h, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                <span className="font-medium uppercase text-[10px] text-gray-600">{h.status}:</span>
                                <span>{h.comment || "Status updated"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleReorder(order)}
                          disabled={actionLoading === order.id}
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold rounded text-xs transition shadow-sm"
                        >
                          Buy it again
                        </button>

                        {canCancel && (
                          <button
                            onClick={() => setCancelModal({ open: true, orderId: order.id, reason: "" })}
                            disabled={actionLoading === order.id}
                            className="px-4 py-2 border border-red-300 hover:bg-red-50 text-red-700 font-semibold rounded text-xs transition"
                          >
                            Cancel Order
                          </button>
                        )}

                        {canReturn && (
                          <button
                            onClick={() => setReturnModal({ open: true, orderId: order.id, reason: "" })}
                            disabled={actionLoading === order.id}
                            className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold rounded text-xs transition"
                          >
                            Return Item
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="divide-y divide-gray-100">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="py-3 flex items-center gap-4">
                          <img
                            src={item.product_image || item.image || "https://placehold.co/80x80?text=Product"}
                            alt={item.product_name || item.title}
                            className="w-16 h-16 object-contain rounded border p-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {item.product_name || item.title || "Product Item"}
                            </h4>
                            <div className="text-xs text-gray-500 mt-1">
                              Qty: {item.quantity || 1} &bull; Price: ₹{Number(item.product_price || item.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            ₹{((item.quantity || 1) * (item.product_price || item.price || 0)).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Order #{cancelModal.orderId}</h3>
              <p className="text-xs text-gray-500 mb-4">
                Are you sure you want to cancel this order? Reserved stock items will be automatically returned to inventory.
              </p>
              <textarea
                rows={3}
                placeholder="Reason for cancellation (optional)"
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                className="w-full border rounded p-2 text-sm mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCancelModal({ open: false, orderId: null, reason: "" })}
                  className="px-4 py-2 border rounded text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Return Modal */}
        {returnModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Request Return for #{returnModal.orderId}</h3>
              <p className="text-xs text-gray-500 mb-4">
                Please let us know why you are returning this order. Our team will review and approve the refund workflow.
              </p>
              <textarea
                required
                rows={3}
                placeholder="Describe reason for return (e.g. damaged, wrong item, defective)..."
                value={returnModal.reason}
                onChange={(e) => setReturnModal({ ...returnModal, reason: e.target.value })}
                className="w-full border rounded p-2 text-sm mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setReturnModal({ open: false, orderId: null, reason: "" })}
                  className="px-4 py-2 border rounded text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleReturn}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded text-xs"
                >
                  Submit Return Request
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
