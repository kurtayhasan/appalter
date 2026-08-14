"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CompareItem {
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  category_slug?: string | null;
}

interface CompareContextType {
  selectedItems: CompareItem[];
  addToCompare: (item: CompareItem) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;
  isInCompare: (slug: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([]);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("appalter_compare");
      if (saved) {
        setSelectedItems(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem("appalter_compare", JSON.stringify(selectedItems));
    } catch {
      // Ignore
    }
  }, [selectedItems]);

  const addToCompare = (item: CompareItem) => {
    setSelectedItems((prev) => {
      if (prev.some((i) => i.slug === item.slug)) return prev;
      if (prev.length >= 2) {
        const secondItem = prev[1];
        return secondItem ? [secondItem, item] : [item];
      }
      return [...prev, item];
    });
  };

  const removeFromCompare = (slug: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.slug !== slug));
  };

  const clearCompare = () => {
    setSelectedItems([]);
  };

  const isInCompare = (slug: string) => {
    return selectedItems.some((i) => i.slug === slug);
  };

  return (
    <CompareContext.Provider
      value={{
        selectedItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
