"use client";

import React from "react";
import { useCompare } from "@/context/CompareContext";

interface CompareButtonProps {
  software: {
    id: string;
    slug: string;
    name: string;
    logo_url?: string | null;
    category_slug?: string | null;
  };
}

export function CompareButton({ software }: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const selected = isInCompare(software.slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selected) {
      removeFromCompare(software.slug);
    } else {
      addToCompare({
        id: software.id,
        slug: software.slug,
        name: software.name,
        logo_url: software.logo_url,
        category_slug: software.category_slug,
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        background: selected ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${selected ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
        color: selected ? "#818cf8" : "var(--text-secondary)",
        padding: "0.25rem 0.6rem",
        borderRadius: "6px",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      title={selected ? "Remove from comparison" : "Add to comparison"}
    >
      <span>{selected ? "✓" : "+"}</span>
      <span>{selected ? "Comparing" : "Compare"}</span>
    </button>
  );
}
