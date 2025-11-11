import React, { useState } from "react";
import { submitIssueAPI } from "@/lib/api.issues"; // <-- using API file

const IssueForm = () => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [nonTechnicalType, setNonTechnicalType] = useState("");

  const [formData, setFormData] = useState({
    user_email: "",
    issue_description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --------------------------
  // Handlers
  // --------------------------

  const handleCategorySelect = (value) => {
    setCategory(value);
    setStep(2);
    setMessage({ type: "", text: "" });
  };

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        user_email: formData.user_email.trim(),
        category,
        issue_description: formData.issue_description.trim(),
        ...(category === "non-technical" && {
          non_technical_type: nonTechnicalType,
        }),
      };

      const result = await submitIssueAPI(payload);

      setMessage({ type: "success", text: result.message });
      setFormData({ user_email: "", issue_description: "" });
      setNonTechnicalType("");

      setTimeout(() => {
        setCategory("");
        setStep(1);
        setMessage({ type: "", text: "" });
      }, 1800);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setCategory("");
    setNonTechnicalType("");
    setFormData({ user_email: "", issue_description: "" });
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Veranda</h1>
          <p className="text-gray-500 text-sm">Report an Issue</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-8">

          {/* ------------------ STEP 1: CATEGORY ------------------ */}
          {step === 1 ? (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-5">
                Select Issue Category
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => handleCategorySelect("technical")}
                  className="w-full p-4 border rounded-lg hover:border-cyan-500 transition-all"
                >
                  <h3 className="font-semibold">Technical Issue</h3>
                  <p className="text-xs text-gray-500">
                    WiFi, network, laptop issues
                  </p>
                </button>

                <button
                  onClick={() => handleCategorySelect("non-technical")}
                  className="w-full p-4 border rounded-lg hover:border-cyan-500 transition-all"
                >
                  <h3 className="font-semibold">Non-Technical Issue</h3>
                  <p className="text-xs text-gray-500">
                    Transport, mess, education
                  </p>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Back */}
              <button
                onClick={handleBack}
                className="mb-6 flex items-center text-gray-600 hover:text-gray-900 text-sm"
              >
                ← Back
              </button>

              <h2 className="text-lg font-semibold text-gray-800 mb-5">
                {category === "technical"
                  ? "Technical Issue"
                  : "Non-Technical Issue"}
              </h2>

              {/* Non-Technical Type */}
              {category === "non-technical" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Issue Type
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {["transport", "mess", "education"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNonTechnicalType(type)}
                        className={`p-2 border rounded-lg text-xs font-medium transition-all ${
                          nonTechnicalType === type
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------ FORM ------------------ */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    name="user_email"
                    value={formData.user_email}
                    onChange={handleInput}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Description
                  </label>
                  <textarea
                    name="issue_description"
                    value={formData.issue_description}
                    onChange={handleInput}
                    rows="5"
                    className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                {/* Message */}
                {message.text && (
                  <div
                    className={`p-4 rounded-lg text-sm ${
                      message.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg text-white font-medium ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-600"
                  }`}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueForm;
