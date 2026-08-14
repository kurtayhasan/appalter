"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/routing";

interface LiveSoftware {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  logo_url?: string;
  avg_rating?: number;
  review_count?: number;
  starting_price?: number;
  is_featured?: boolean;
}

interface LiveCategory {
  id: string;
  slug: string;
  name: string;
  icon_url?: string;
  software_count?: number;
}

interface LiveSearchResult {
  softwares: LiveSoftware[];
  categories: LiveCategory[];
}

export function LiveSearchModal({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LiveSearchResult>({ softwares: [], categories: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchResults(""); // Initial suggestions
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  const fetchResults = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/live?q=${encodeURIComponent(searchQuery)}&locale=${locale}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Failed to fetch live search results:", err);
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 180);
    return () => clearTimeout(timer);
  }, [query, isOpen, fetchResults]);

  // Flattened items for keyboard navigation
  const allItems = [
    ...results.categories.map((c) => ({ type: "category" as const, data: c })),
    ...results.softwares.map((s) => ({ type: "software" as const, data: s })),
  ];

  const handleSelect = (index: number) => {
    if (index < 0 || index >= allItems.length) {
      if (query.trim()) {
        router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
      return;
    }
    const item = allItems[index];
    if (!item) {
      if (query.trim()) {
        router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
      return;
    }
    if (item.type === "category") {
      router.push(`/${locale}/category/${item.data.slug}`);
    } else {
      router.push(`/${locale}/${item.data.slug}`);
    }
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  return (
    <>
      {/* Header Trigger Button */}
      <button
        type="button"
        className="live-search-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Open Search (Cmd+K)"
        title="Open Search (Cmd+K)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="live-search-placeholder">Search software, alternatives...</span>
        <kbd className="live-search-kbd">⌘K</kbd>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="live-search-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="live-search-dialog"
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            {/* Input Bar */}
            <div className="live-search-input-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="live-search-modal-input"
                placeholder="Type a software name (e.g. Notion, Slack, Jira)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
              />
              {query && (
                <button
                  type="button"
                  className="clear-query-btn"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setIsOpen(false)}
              >
                ESC
              </button>
            </div>

            {/* Results Container */}
            <div className="live-search-results">
              {isLoading && (
                <div className="live-search-loading">
                  <div className="spinner" />
                  <span>Searching...</span>
                </div>
              )}

              {/* Categories Section */}
              {results.categories.length > 0 && (
                <div className="live-search-group">
                  <div className="live-search-group-title">Categories</div>
                  <div className="live-search-group-items">
                    {results.categories.map((cat, idx) => {
                      const itemIndex = idx;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <div
                          key={cat.id}
                          className={`live-search-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            router.push(`/${locale}/category/${cat.slug}`);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                        >
                          <div className="item-icon-wrapper">
                            📁
                          </div>
                          <div className="item-info">
                            <span className="item-title">{cat.name}</span>
                            <span className="item-sub">{cat.software_count ?? 0} products</span>
                          </div>
                          <span className="item-action-hint">Explore →</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Software Section */}
              {results.softwares.length > 0 && (
                <div className="live-search-group">
                  <div className="live-search-group-title">
                    {query ? "Software & Tools" : "Popular & Trending Tools"}
                  </div>
                  <div className="live-search-group-items">
                    {results.softwares.map((sw, idx) => {
                      const itemIndex = results.categories.length + idx;
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <div
                          key={sw.id}
                          className={`live-search-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            router.push(`/${locale}/${sw.slug}`);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                        >
                          <div className="item-logo-wrapper">
                            {sw.logo_url ? (
                              <Image
                                src={sw.logo_url}
                                alt={sw.name}
                                width={32}
                                height={32}
                                className="item-logo"
                              />
                            ) : (
                              <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sw.name)}&background=random&color=fff&size=64&rounded=true`}
                                alt={sw.name}
                                width={32}
                                height={32}
                                className="item-logo"
                              />
                            )}
                          </div>
                          <div className="item-info">
                            <div className="item-header-line">
                              <span className="item-title">{sw.name}</span>
                              {sw.is_featured && <span className="item-badge-featured">Featured</span>}
                            </div>
                            <span className="item-sub">{sw.tagline || "Software profile & alternatives"}</span>
                          </div>
                          {sw.avg_rating ? (
                            <div className="item-rating">
                              ★ {sw.avg_rating.toFixed(1)}
                            </div>
                          ) : (
                            <span className="item-action-hint">View →</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && query && results.softwares.length === 0 && results.categories.length === 0 && (
                <div className="live-search-empty">
                  <p>No direct results found for &ldquo;{query}&rdquo;</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      router.push(`/${locale}/search?q=${encodeURIComponent(query)}`);
                      setIsOpen(false);
                    }}
                  >
                    Search all software for &ldquo;{query}&rdquo; →
                  </button>
                </div>
              )}
            </div>

            {/* Footer / Shortcuts */}
            <div className="live-search-footer">
              <div className="shortcuts">
                <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
                <span><kbd>↵</kbd> Select</span>
                <span><kbd>ESC</kbd> Close</span>
              </div>
              {query && (
                <Link
                  href={`/${locale}/search?q=${encodeURIComponent(query)}`}
                  className="all-results-link"
                  onClick={() => setIsOpen(false)}
                >
                  See all results for &ldquo;{query}&rdquo; →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
