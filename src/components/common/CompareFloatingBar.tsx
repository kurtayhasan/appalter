"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCompare } from "@/context/CompareContext";
import { useLocale } from "next-intl";

export function CompareFloatingBar() {
  const { selectedItems, removeFromCompare, clearCompare } = useCompare();
  const locale = useLocale();

  if (selectedItems.length === 0) return null;

  const item1 = selectedItems[0];
  const item2 = selectedItems[1];
  if (!item1) return null;

  const isReady = Boolean(item1 && item2);

  const vsUrl = isReady && item2
    ? `/${locale}/${item1.slug}/vs/${item2.slug}`
    : "#";

  return (
    <div
      className="compare-floating-bar"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        background: "var(--bg-card)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-lg), 0 10px 35px rgba(0,0,0,0.15)",
        borderRadius: "9999px",
        padding: "0.5rem 0.75rem 0.5rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        maxWidth: "92vw",
        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Label / Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
          {isReady ? "Ready to Compare:" : "Compare (1/2):"}
        </span>

        {/* Selected Slots */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Slot 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-subtle)",
              padding: "0.25rem 0.6rem 0.25rem 0.4rem",
              borderRadius: "9999px",
              fontSize: "0.825rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {item1.logo_url ? (
              <Image src={item1.logo_url} alt={item1.name} width={20} height={20} style={{ borderRadius: "4px", objectFit: "contain" }} />
            ) : (
              <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--accent-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                {item1.name.slice(0, 1)}
              </div>
            )}
            <span>{item1.name}</span>
            <button
              onClick={() => removeFromCompare(item1.slug)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 2px", fontSize: "0.9rem", lineHeight: 1 }}
              title="Remove"
            >
              ✕
            </button>
          </div>

          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>VS</span>

          {/* Slot 2 */}
          {item2 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-subtle)",
                padding: "0.25rem 0.6rem 0.25rem 0.4rem",
                borderRadius: "9999px",
                fontSize: "0.825rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {item2.logo_url ? (
                <Image src={item2.logo_url} alt={item2.name} width={20} height={20} style={{ borderRadius: "4px", objectFit: "contain" }} />
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--success)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {item2.name.slice(0, 1)}
                </div>
              )}
              <span>{item2.name}</span>
              <button
                onClick={() => removeFromCompare(item2.slug)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0 2px", fontSize: "0.9rem", lineHeight: 1 }}
                title="Remove"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                border: "1px dashed var(--border-subtle)",
                background: "var(--bg-secondary)",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              + Select 2nd tool
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "0.5rem" }}>
        {isReady ? (
          <Link
            href={vsUrl}
            className="btn btn-primary"
            style={{
              padding: "0.45rem 1.15rem",
              fontSize: "0.85rem",
              borderRadius: "9999px",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Compare Now →
          </Link>
        ) : (
          <button
            disabled
            style={{
              padding: "0.45rem 1.15rem",
              fontSize: "0.85rem",
              borderRadius: "9999px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: "var(--bg-tertiary)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              cursor: "not-allowed",
            }}
          >
            Select 1 more
          </button>
        )}

        <button
          onClick={clearCompare}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            cursor: "pointer",
            padding: "0.4rem 0.5rem",
            textDecoration: "underline",
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
