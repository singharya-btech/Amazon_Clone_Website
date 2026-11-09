import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import "./Admin.css";

const AdminEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [rating, setRating] = useState(4);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageData, setImageData] = useState("");

  useEffect(() => {
    const admin = localStorage.getItem("adminUser");
    if (!admin) navigate("/admin/login");

    const stored = localStorage.getItem("products");
    const all = stored ? JSON.parse(stored) : [];
    const p = all.find((x) => String(x.id) === String(id));
    if (!p) {
      navigate("/admin/panel");
      return;
    }

    // only owner can edit
    const owner = p.owner;
    const user = admin ? JSON.parse(admin).username : null;
    if (owner !== user) {
      alert("You are not allowed to edit this product.");
      navigate("/admin/panel");
      return;
    }

    setProduct(p);
    setTitle(p.title || "");
    setPrice(p.price || 0);
    setRating(p.rating || 4);
    setCategory(p.category || "");
    setDescription(p.description || "");
    setImageData(p.image || "");
  }, [id, navigate]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const stored = localStorage.getItem("products");
    const all = stored ? JSON.parse(stored) : [];
    const updated = all.map((p) => {
      if (String(p.id) === String(id)) {
        return { ...p, title, price: Number(price), rating: Number(rating), category, description, image: imageData };
      }
      return p;
    });
    localStorage.setItem("products", JSON.stringify(updated));
    navigate("/admin/panel");
  };

  if (!product) return null;

  return (
    <>
      <Header />
      <Navbar />

      <div className="adminPage">
        <h1>Edit Product</h1>
        <form className="adminForm" onSubmit={handleSave}>
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>Price</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />

          <label>Rating</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />

          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleImage} />

          {imageData && <img src={imageData} alt="preview" className="preview" />}

          <button type="submit" className="saveBtn">Save Changes</button>
        </form>
      </div>

      <Footer />
    </>
  );
};

export default AdminEdit;
