"use client";

import { useEffect, useRef } from "react";

interface AdBannerProps {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "rectangle";
  fullWidthResponsive?: boolean;
  className?: string;
}

export function AdBanner({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  className = "",
}: AdBannerProps) {
  // Ads disabled for ultra-clean, high-trust UX and affiliate focus
  return null;
}
