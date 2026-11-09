import React, { useState, useEffect } from "react";
import { getProductReviews, submitReview, voteReview } from "../services/reviewService";
import { useAuth } from "../context/AuthContext";

const AdvancedReviewSection = ({ productId, averageRating = 4.5, totalReviews = 0 }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // New review form
  const [form, setForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    image1: "",
    image2: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await getProductReviews(productId);
      setReviews(data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleVote = async (reviewId, voteType) => {
    if (!isAuthenticated) {
      alert("Please sign in to vote on customer reviews.");
      return;
    }
    try {
      const res = await voteReview(reviewId, voteType);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, helpful_votes: res.helpful_votes, unhelpful_votes: res.unhelpful_votes }
            : r
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || "Could not record vote.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const images = [form.image1, form.image2].filter((url) => url && url.trim().length > 5);
    try {
      await submitReview({
        product_id: productId,
        rating: Number(form.rating),
        title: form.title,
        comment: form.comment,
        images,
      });
      setModalOpen(false);
      setForm({ rating: 5, title: "", comment: "", image1: "", image2: "" });
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 my-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-amber-500 font-extrabold text-lg">★ {Number(averageRating).toFixed(1)} out of 5</span>
            <span className="text-xs text-gray-500">({reviews.length} customer ratings)</span>
          </div>
        </div>

        {isAuthenticated ? (
          <button
            onClick={() => setModalOpen(true)}
            className="border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold px-4 py-2 rounded text-xs shadow-sm transition"
          >
            Write a Customer Review
          </button>
        ) : (
          <div className="text-xs text-gray-500">Sign in to leave a verified review.</div>
        )}
      </div>

      {/* Review List */}
      <div className="divide-y divide-gray-100 mt-4">
        {loading ? (
          <div className="text-center py-8 text-xs text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">No customer reviews yet. Be the first to share your thoughts!</div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="py-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-700">
                  {(rev.customer_name?.[0] || "U").toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-gray-800">{rev.customer_name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-sm font-bold">{"★".repeat(rev.rating)}</span>
                <span className="font-bold text-xs text-gray-900">{rev.title || "Review"}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-gray-400">Reviewed on {new Date(rev.created_at).toLocaleDateString()}</span>
                {rev.verified_purchase && (
                  <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                    ✓ Verified Purchase
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">{rev.comment}</p>

              {/* Review Images */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2 pt-1">
                  {rev.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt="Review attachment"
                      onClick={() => setSelectedPhoto(img.image_url)}
                      className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-105 transition"
                    />
                  ))}
                </div>
              )}

              {/* Helpful Votes */}
              <div className="pt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>{rev.helpful_votes} people found this helpful</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote(rev.id, "helpful")}
                    className="border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-[11px] font-semibold text-gray-700 transition"
                  >
                    Helpful ({rev.helpful_votes})
                  </button>
                  <button
                    onClick={() => handleVote(rev.id, "unhelpful")}
                    className="text-gray-400 hover:text-gray-600 text-[11px]"
                  >
                    Report
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Create Customer Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Overall Rating</label>
                <div className="flex gap-2 text-xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setForm({ ...form, rating: star })}
                      className={star <= form.rating ? "text-amber-500" : "text-gray-300"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Review Headline</label>
                <input
                  required
                  type="text"
                  placeholder="What's most important to know?"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Add Written Review</label>
                <textarea
                  required
                  rows={4}
                  placeholder="What did you like or dislike? How does it perform?"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Photo URL 1 (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={form.image1}
                  onChange={(e) => setForm({ ...form, image1: e.target.value })}
                  className="w-full border rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Photo URL 2 (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo2.jpg"
                  value={form.image2}
                  onChange={(e) => setForm({ ...form, image2: e.target.value })}
                  className="w-full border rounded px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold rounded shadow"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={selectedPhoto} alt="Zoomed review" className="max-w-2xl max-h-[80vh] object-contain rounded" />
        </div>
      )}
    </div>
  );
};

export default AdvancedReviewSection;
