import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Orders.css";
import { Link, useLocation } from "react-router-dom";
import { getOrders } from "../services/orderService";

const Orders = () => {
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;
  const justPlacedId = location.state?.orderId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setOrders(await getOrders());
      } catch (e) {
        const message = e.response?.data?.detail || e.message || "Could not load your orders.";
        setError(typeof message === "string" ? message : JSON.stringify(message));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <Header />
      <Navbar />

      <div className="orders">

        <h1>Your Orders</h1>

        {justPlaced && (
          <div className="orderConfirmedBanner">
            ✅ Order placed successfully! Order ID: <strong>{justPlacedId}</strong> — paying by Cash on Delivery.
          </div>
        )}

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {loading ? (
          <p>Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div className="noOrders">
            <p>You have no orders yet.</p>
            <Link to="/shop" className="detailsBtn">Go Shopping</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div className="orderCard" key={order.id}>

              <img
                src={order.items && order.items[0] ? order.items[0].product_image : ""}
                alt={order.items && order.items[0] ? order.items[0].product_name : "Order"}
                className="orderImage"
              />

              <div className="orderInfo">

                <h3>{order.items && order.items[0] ? order.items[0].product_name : `Order ${order.id}`}</h3>

                <p>
                  <strong>Order ID:</strong> {order.id}
                </p>

                <p>
                  <strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}
                </p>

                <p>
                  <strong>Status:</strong>
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </p>

                <p><strong>Payment:</strong> Cash on Delivery</p>

                <p><strong>Items:</strong> {order.items ? order.items.length : 0}</p>

                {order.items && order.items.length > 1 && (
                  <ul style={{ margin: "4px 0 8px", paddingLeft: 18 }}>
                    {order.items.map((it) => (
                      <li key={it.product_id} style={{ fontSize: "0.9em" }}>
                        {it.product_name} × {it.quantity} —{" "}
                        <span className={`status ${it.item_status.toLowerCase()}`}>
                          {it.item_status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <h2>₹{order.total}</h2>

              </div>

              <Link to={`/product/${order.items && order.items[0] ? order.items[0].product_id : ""}`} className="detailsBtn">
                View Details
              </Link>

            </div>
          ))
        )}

      </div>

      <Footer />
    </>
  );
};

export default Orders;