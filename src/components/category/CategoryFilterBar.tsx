"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface CategoryFilterBarProps {
  currentPricing?: string;
  currentPlatform?: string;
  currentSort?: string;
}

const PRICING_OPTIONS = [
  { label: "All Pricing", value: "" },
  { label: "Free / Freemium", value: "free" },
  { label: "Free Trial", value: "trial" },
  { label: "Paid Only", value: "paid" },
];

const PLATFORM_OPTIONS = [
  { label: "All Platforms", value: "" },
  { label: "Web", value: "web" },
  { label: "macOS", value: "mac" },
  { label: "Windows", value: "windows" },
  { label: "iOS / Android", value: "mobile" },
];

const SORT_OPTIONS = [
  { label: "Relevance / Top Picks", value: "relevance" },
  { label: "Highest Rated", value: "rating" },
  { label: "Most Reviewed", value: "reviews" },
  { label: "Newest Added", value: "newest" },
];

export function CategoryFilterBar({
  currentPricing = "",
  currentPlatform = "",
  currentSort = "relevance",
}: CategoryFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "relevance") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 on filter change
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const activePricing = searchParams.get("pricing") || currentPricing;
  const activePlatform = searchParams.get("platform") || currentPlatform;
  const activeSort = searchParams.get("sort") || currentSort;

  const hasActiveFilters = activePricing || activePlatform || (activeSort && activeSort !== "relevance");

  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
  };

  return (
    <div
      className="category-filter-bar"
      style={{
        marginBottom: "2rem",
        padding: "1rem 1.25rem",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      {/* Filters Group */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}>
        {/* Pricing Filter Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--bg-tertiary)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
          {PRICING_OPTIONS.map((opt) => {
            const isSelected = activePricing === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleFilterChange("pricing", opt.value)}
                type="button"
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.8rem",
                  fontWeight: isSelected ? 700 : 500,
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: isSelected ? "var(--accent-primary)" : "transparent",
                  color: isSelected ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 2px 8px rgba(99, 102, 241, 0.4)" : "none",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Platform Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <select
            value={activePlatform}
            onChange={(e) => handleFilterChange("platform", e.target.value)}
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.85rem",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {PLATFORM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort & Reset Group */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Sort Select */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Sort by:</span>
          <select
            value={activeSort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            style={{
              padding: "0.45rem 0.85rem",
              fontSize: "0.85rem",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-primary)",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
