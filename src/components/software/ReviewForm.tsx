"use client";

import React, { useState } from "react";

interface ReviewFormProps {
  softwareId: string;
  softwareSlug?: string;
  locale: string;
  onReviewSubmitted?: (newReview: any) => void;
}

export function ReviewForm({
  softwareId,
  softwareSlug,
  locale,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mountedAt] = useState<number>(() => Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) {
      setError("Please fill in your name and review message.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          software_id: softwareId,
          software_slug: softwareSlug,
          reviewer_name: name,
          reviewer_role: role,
          rating,
          title,
          review_body: body,
          locale,
          _ts: mountedAt,
          _hp: "", // Honeypot
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit review. Please try again.");
      } else {
        setSuccess(true);
        if (onReviewSubmitted && data.review) {
          onReviewSubmitted(data.review);
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && !success) {
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn btn-primary btn-sm"
          style={{ fontWeight: 600, padding: "0.5rem 1.25rem" }}
        >
          ✍️ Write a Review
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1.25rem 1.5rem",
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.25)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
        }}
      >
        <div style={{ fontWeight: 700, color: "var(--success)", fontSize: "1rem", marginBottom: "0.25rem" }}>
          ✓ Thank you for your review!
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
          Your verified feedback has been published and helps the community make informed decisions.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "1.5rem",
        padding: "1.5rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          Write a Review
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem" }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {error && (
        <div style={{ padding: "0.6rem 0.85rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "6px", color: "var(--danger)", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {/* Star Selector */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
          Rating *
        </label>
        <div style={{ display: "inline-flex", gap: "4px", cursor: "pointer" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                color: (hoverRating ?? rating) >= star ? "#f59e0b" : "var(--border-subtle)",
                cursor: "pointer",
                padding: "2px",
                lineHeight: 1,
              }}
              aria-label={`${star} star`}
            >
              ★
            </button>
          ))}
          <span style={{ marginLeft: "0.5rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", alignSelf: "center" }}>
            {rating} / 5
          </span>
        </div>
      </div>

      {/* Name and Role Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
            Your Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Jenkins"
            required
            style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.9rem" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
            Role / Industry (Optional)
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Small Business Owner, DevOps"
            style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.9rem" }}
          />
        </div>
      </div>

      {/* Title */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
          Review Headline
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Excellent speed and very easy to set up"
          style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.9rem" }}
        />
      </div>

      {/* Body */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
          Your Experience / Feedback *
        </label>
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike? How does it compare to alternatives?"
          required
          style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.9rem", resize: "vertical" }}
        />
      </div>

      {/* Submit Buttons */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary btn-sm"
          style={{ fontWeight: 600, padding: "0.55rem 1.5rem" }}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
