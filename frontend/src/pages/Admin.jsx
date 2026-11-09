import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../services/productService";

import "./Admin.css";

const categories = ["Mobiles", "Electronics", "Accessories", "Fashion", "Books", "Home & Kitchen"];

const Admin = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [rating, setRating] = useState(4);
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [imageData, setImageData] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const admin = localStorage.getItem("adminUser");
    if (!admin) {
      navigate("/admin/login");
    }
  }, [navigate]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const admin = localStorage.getItem("adminUser");
    if (!admin) {
      navigate("/admin/login");
      return;
    }

    const id = Date.now();
    const product = {
      id,
      title,
      price: Number(price),
      rating: Number(rating),
      category,
      description,
      image: imageData,
    };

    const apiProduct = {
      name: title,
      category,
      description,
      price: Number(price),
      compare_price: null,
      image: imageData,
      image_2: "",
      image_3: "",
      stock: 0,
      is_featured: false,
      rating: Number(rating),
      num_reviews: 0,
      is_active: true,
    };

    let createdProduct = null;

    setError("");
    try {
      createdProduct = await createProduct(apiProduct);
    } catch (err) {
      console.error("Product API create failed:", err);
      setError("Unable to save product to the backend. Please try again.");
      return;
    }

    try {
      const stored = localStorage.getItem("products");
      const products = stored ? JSON.parse(stored) : [];
      const admin = localStorage.getItem("adminUser");
      if (admin) {
        const a = JSON.parse(admin);
        product.owner = a.username;
      }

      products.unshift({
        id: createdProduct.id || id,
        title: createdProduct.name || title,
        price: createdProduct.price,
        rating: createdProduct.rating,
        category: createdProduct.category_name || category,
        description: createdProduct.description,
        image: createdProduct.image || imageData,
        owner: product.owner,
      });

      localStorage.setItem("products", JSON.stringify(products));
    } catch (err) {
      console.error(err);
    }

    // Reset form
    setTitle("");
    setPrice(0);
    setRating(4);
    setCategory(categories[0]);
    setDescription("");
    setImageData("");

    navigate("/shop");
  };

  return (
    <>
      <Header />
      <Navbar />

      <div className="adminPage">
        <h1>Admin — Add Product</h1>

        <form className="adminForm" onSubmit={handleSubmit}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>Price</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />

          <label>Rating</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleImage} />

          {imageData && <img src={imageData} alt="preview" className="preview" />}

          {error && <div className="errorMessage">{error}</div>}
          <button type="submit" className="saveBtn">Add Product</button>
        </form>
      </div>

      <Footer />
    </>
  );
};

export default Admin;
