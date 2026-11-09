import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate, Link } from "react-router-dom";
import { logoutUser } from "../services/authService";
import { deleteProduct, getProducts } from "../services/productService";
import { getProductReviews } from "../services/reviewService";

import "./Admin.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [reviewsByProduct, setReviewsByProduct] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedAdmin = localStorage.getItem("adminUser");
    if (!savedAdmin) {
      navigate("/admin/login");
      return;
    }

    const currentAdmin = JSON.parse(savedAdmin);
    setAdmin(currentAdmin);

    const loadProducts = async () => {
      let localProducts = [];
      try {
        const stored = localStorage.getItem("products");
        const all = stored ? JSON.parse(stored) : [];
        localProducts = all.filter((product) => product.owner === currentAdmin.username);
      } catch (error) {
        console.error("Unable to read local products:", error);
      }

      try {
        const apiProducts = await getProducts({ mine: "true" });
        const ownedApiProducts = apiProducts.map((product) => ({
          id: product.id,
          slug: product.slug,
          title: product.name,
          price: product.price,
          image: product.image,
          category: product.category_name || "Uncategorised",
          brand: product.brand,
          rating: product.rating,
          num_reviews: product.num_reviews,
          owner: product.owner_username,
        }));
        const merged = [...ownedApiProducts, ...localProducts.filter((local) => !ownedApiProducts.some((apiProduct) => apiProduct.id === local.id))];
        setProducts(merged);

        const reviewEntries = await Promise.all(merged.map(async (product) => {
          try {
            const reviews = await getProductReviews(product.slug || product.id);
            return [product.id, reviews];
          } catch {
            return [product.id, []];
          }
        }));
        setReviewsByProduct(Object.fromEntries(reviewEntries));
      } catch (error) {
        console.error("Unable to load admin products:", error);
        setProducts(localProducts);
        setMessage("Backend products could not be loaded. Showing products stored in this browser.");
      }
    };

    loadProducts();
  }, [navigate]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.title}? This cannot be undone.`)) return;
    setMessage("");

    try {
      if (product.slug) await deleteProduct(product.slug);
      const stored = localStorage.getItem("products");
      const all = stored ? JSON.parse(stored) : [];
      localStorage.setItem("products", JSON.stringify(all.filter((item) => String(item.id) !== String(product.id))));
      setProducts((current) => current.filter((item) => String(item.id) !== String(product.id)));
      setMessage("Product deleted.");
    } catch (error) {
      console.error("Unable to delete product:", error);
      setMessage(error.response?.data?.detail || "Unable to delete this product.");
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/admin/login");
  };

  return (
    <>
      <Header />
      <Navbar />

      <div className="adminPage">
        <div className="adminPanel__header">
          <h1>Admin Panel</h1>
          <div>
            <strong>{admin?.username}</strong>
            <button onClick={() => navigate("/admin")}>Add Product</button>
            <button onClick={handleLogout}>Admin logout</button>
          </div>
        </div>

        {message && <p className="adminPanel__message">{message}</p>}

        <div className="adminPanel__grid">
          {products.length === 0 ? (
            <div>No products yet. <Link to="/admin">Add one</Link></div>
          ) : products.map((product) => {
            const reviews = reviewsByProduct[product.id] || [];
            const rating = reviews.length
              ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
              : product.rating || 0;
            return (
              <article key={product.id} className="adminProduct">
                <img src={product.image} alt={product.title} />
                <h3>{product.title}</h3>
                <p>Price: ₹{product.price}</p>
                <p>Category: {product.category}</p>
                {product.brand && <p>Brand: {product.brand}</p>}
                <p className="adminProduct__rating">★ {rating} ({reviews.length || product.num_reviews || 0} reviews)</p>

                <div className="adminProduct__reviews">
                  <strong>Customer reviews</strong>
                  {reviews.length ? reviews.slice(0, 3).map((review) => (
                    <p key={review.id}><b>{review.author}</b> · {review.rating}/5<br />{review.comment}</p>
                  )) : <p>No reviews yet.</p>}
                </div>

                <div className="adminProduct__actions">
                  <button onClick={() => navigate(`/admin/edit/${product.id}`)}>Edit</button>
                  <button className="adminProduct__delete" onClick={() => handleDelete(product)}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AdminPanel;
