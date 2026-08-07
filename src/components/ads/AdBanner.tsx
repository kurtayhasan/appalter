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
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    try {
      if (adRef.current && !adRef.current.hasAttribute("data-adsbygoogle-status")) {
        timeoutId = setTimeout(() => {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }, 150);
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className={`ad-container ${className}`} aria-label="Advertisement">
      <span className="ad-label">Advertisement</span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minWidth: "250px", width: "100%" }}
        data-ad-client="ca-pub-5280507999154958"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}
