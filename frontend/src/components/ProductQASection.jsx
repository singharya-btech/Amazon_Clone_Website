import React, { useState, useEffect } from "react";
import { getProductQA, askProductQuestion, answerProductQuestion } from "../services/productService";
import { useAuth } from "../context/AuthContext";

const ProductQASection = ({ productId }) => {
  const { isAuthenticated } = useAuth();
  const [qaList, setQaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQA = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await getProductQA(productId);
      setQaList(data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQA();
  }, [productId]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      await askProductQuestion(productId, questionText.trim());
      setQuestionText("");
      fetchQA();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (questionId) => {
    if (!replyText.trim()) return;
    try {
      await answerProductQuestion(questionId, replyText.trim());
      setReplyText("");
      setActiveReplyId(null);
      fetchQA();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to post answer.");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 my-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Customer Questions & Answers</h2>
      <p className="text-xs text-gray-500 mb-6">Have a question? Search for answers or ask the community.</p>

      {/* Ask Question Form */}
      {isAuthenticated ? (
        <form onSubmit={handleAskQuestion} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Have a question? Search or ask..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="flex-1 border rounded px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 py-2 rounded text-xs transition"
          >
            {submitting ? "Posting..." : "Ask Question"}
          </button>
        </form>
      ) : (
        <div className="bg-amber-50 p-3 rounded text-xs text-gray-700 mb-6">
          <span>Sign in to post questions and answers about this item.</span>
        </div>
      )}

      {/* QA Listing */}
      {loading ? (
        <div className="text-center py-6 text-xs text-gray-400">Loading questions...</div>
      ) : qaList.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400">No questions asked yet. Be the first to ask!</div>
      ) : (
        <div className="space-y-4 divide-y divide-gray-100">
          {qaList.map((qa) => (
            <div key={qa.id} className="pt-4 first:pt-0">
              {/* Question */}
              <div className="flex items-start gap-2 text-sm font-bold text-gray-900">
                <span className="text-amber-600 font-extrabold text-base">Q:</span>
                <div>
                  {qa.question_text}
                  <span className="text-[10px] text-gray-400 font-normal block">
                    Asked by {qa.user_name} on {new Date(qa.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Answers */}
              <div className="mt-2 ml-5 space-y-2">
                {(qa.answers || []).map((ans) => (
                  <div key={ans.id} className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded flex items-start gap-2">
                    <span className="font-bold text-gray-900">A:</span>
                    <div className="flex-1">
                      <p>{ans.answer_text}</p>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        By <span className={ans.is_seller ? "text-amber-700 font-bold" : "font-medium"}>{ans.user_name}{ans.is_seller && " (Seller)"}</span> &bull; {new Date(ans.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Reply action */}
                {isAuthenticated && (
                  <div>
                    {activeReplyId === qa.id ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          placeholder="Write your answer..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 border rounded px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => handleReply(qa.id)}
                          className="bg-amber-400 hover:bg-amber-500 font-bold px-3 py-1 text-xs rounded"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => setActiveReplyId(null)}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveReplyId(qa.id)}
                        className="text-[11px] text-blue-600 hover:underline mt-1 font-semibold"
                      >
                        + Answer this question
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductQASection;
