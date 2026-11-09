import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { amazonLogo, product1, product2, product3, product4, product5, product6 } from "../assets";
import { useAuth } from "../context/AuthContext";
import { getCurrentUser, updateUser, changePassword } from "../services/authService";
import { getOrders } from "../services/orderService";
import { logoutUser } from "../services/authService";
import "./Profile.css";

const catalogProducts = [
  { id: "1", title: "Apple iPhone 15 Pro", image: product1, price: 999, category: "Mobiles", brand: "Apple" },
  { id: "2", title: "Samsung Galaxy S24 Ultra", image: product2, price: 899, category: "Mobiles", brand: "Samsung" },
  { id: "3", title: "Sony WH-1000XM5 Headphones", image: product3, price: 349, category: "Electronics", brand: "Sony" },
  { id: "4", title: "MacBook Air M3", image: product4, price: 1299, category: "Electronics", brand: "Apple" },
  { id: "5", title: "Smart Watch", image: product5, price: 199, category: "Electronics", brand: "Noise" },
  { id: "6", title: "Gaming Mouse", image: product6, price: 59, category: "Accessories", brand: "Logitech" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const [data, userOrders] = await Promise.all([getCurrentUser(), getOrders()]);
        setProfile(data);
        setOrders(userOrders);
        const userKey = data.username || user.username || user.id;
        const viewed = JSON.parse(localStorage.getItem(`recentlyViewed_${userKey}`) || "[]");
        setRecentlyViewed(viewed);
      } catch (error) {
        console.error("Unable to load profile:", error);
        setOrdersError("Unable to load your order history right now.");
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updatedUser = await updateUser(profile);
      login(updatedUser);
      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update failed:", error);
      const message = error.response?.data || error.message || "Failed to update profile";
      alert(JSON.stringify(message));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      setPasswordSaving(false);
      return;
    }

    try {
      await changePassword({
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      });
      setPasswordMessage("Password changed successfully.");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Password update failed:", error);
      const message = error.response?.data || error.message || "Failed to change password";
      setPasswordMessage(JSON.stringify(message));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    logout();
    navigate("/login");
  };

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;
  const recentCategories = new Set(recentlyViewed.map((item) => item.category));
  const recentBrands = new Set(recentlyViewed.map((item) => item.brand));
  const viewedIds = new Set(recentlyViewed.map((item) => String(item.id)));
  const recommendedProducts = catalogProducts
    .filter((item) => !viewedIds.has(String(item.id)))
    .filter((item) => recentCategories.has(item.category) || recentBrands.has(item.brand))
    .slice(0, 4);

  return (
    <div className="profile">
      <Link to="/">
        <img src={amazonLogo} alt="Amazon Logo" className="profile__logo" />
      </Link>

      <div className="profile__container">
        <h1>Your Profile</h1>

        {loading ? (
          <p>Loading profile…</p>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <label>Username</label>
              <input type="text" name="username" value={profile.username} readOnly />

              <label>Email</label>
              <input type="email" name="email" value={profile.email} onChange={handleChange} required />

              <label>First Name</label>
              <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} />

              <label>Last Name</label>
              <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} />

              <button type="submit" className="profile__button" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </form>

            <div className="profile__divider" />

            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <label>Current Password</label>
              <input
                type="password"
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                required
              />

              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />

              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />

              <button type="submit" className="profile__button" disabled={passwordSaving}>
                {passwordSaving ? "Updating..." : "Change Password"}
              </button>
            </form>

            {passwordMessage && <p className="profile__passwordMessage">{passwordMessage}</p>}

            <div className="profile__divider" />

            <section className="profile__section" aria-labelledby="order-history-heading">
              <div className="profile__sectionHeader">
                <h2 id="order-history-heading">Order History</h2>
                <Link to="/orders">View all orders</Link>
              </div>
              {ordersError ? <p className="profile__error">{ordersError}</p> : orders.length ? (
                <div className="profile__orderList">
                  {orders.slice(0, 3).map((order) => (
                    <article className="profile__order" key={order.id}>
                      <img src={order.items[0]?.product_image || ""} alt="Order item" />
                      <div>
                        <strong>{order.items[0]?.product_name || `Order ${order.id}`}</strong>
                        <span>Placed {new Date(order.created_at).toLocaleDateString()} · {order.status}</span>
                      </div>
                      <b>₹{order.total}</b>
                    </article>
                  ))}
                </div>
              ) : <p className="profile__empty">You have no orders yet.</p>}
            </section>

            <section className="profile__section" aria-labelledby="recently-viewed-heading">
              <h2 id="recently-viewed-heading">Recently Viewed Products</h2>
              {recentlyViewed.length ? (
                <div className="profile__productGrid">
                  {recentlyViewed.slice(0, 4).map((item) => (
                    <Link to={`/product/${item.id}`} className="profile__product" key={item.id}>
                      <img src={item.image} alt={item.title} />
                      <span>{item.title}</span>
                      <b>₹{item.price}</b>
                    </Link>
                  ))}
                </div>
              ) : <p className="profile__empty">Products you view while signed in will appear here.</p>}
            </section>

            <section className="profile__section" aria-labelledby="recommendations-heading">
              <h2 id="recommendations-heading">Recommended for You</h2>
              {recommendedProducts.length ? (
                <div className="profile__productGrid">
                  {recommendedProducts.map((item) => (
                    <Link to={`/product/${item.id}`} className="profile__product" key={item.id}>
                      <img src={item.image} alt={item.title} />
                      <span>{item.title}</span>
                      <b>₹{item.price}</b>
                    </Link>
                  ))}
                </div>
              ) : <p className="profile__empty">View products to receive recommendations.</p>}
            </section>
          </>
        )}

        <div className="profile__footer">
          <span>Signed in as {displayName}</span>
          <button type="button" className="profile__logout" onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
