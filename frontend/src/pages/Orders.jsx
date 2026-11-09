import React from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Orders.css";
import { Link } from "react-router-dom";

const Orders = () => {
  let orders = [];

  try {
    const stored = localStorage.getItem("orders");
    orders = stored ? JSON.parse(stored) : [];
  } catch (e) {
    orders = [];
  }

  return (
    <>
      <Header />
      <Navbar />

      <div className="orders">

        <h1>Your Orders</h1>

        {orders.length === 0 ? (
          <div className="noOrders">
            <p>You have no orders yet.</p>
            <Link to="/shop" className="detailsBtn">Go Shopping</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div className="orderCard" key={order.id}>

              <img
                src={order.items && order.items[0] ? order.items[0].image : ""}
                alt={order.items && order.items[0] ? order.items[0].title : "Order"}
                className="orderImage"
              />

              <div className="orderInfo">

                <h3>{order.items && order.items[0] ? order.items[0].title : `Order ${order.id}`}</h3>

                <p>
                  <strong>Order ID:</strong> {order.id}
                </p>

                <p>
                  <strong>Order Date:</strong> {order.date}
                </p>

                <p>
                  <strong>Status:</strong>
                  <span className={`status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </p>

                <h2>₹{order.total}</h2>

              </div>

              <button className="detailsBtn">View Details</button>

            </div>
          ))
        )}

      </div>

      <Footer />
    </>
  );
};

export default Orders;