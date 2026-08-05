// src/components/software/PricingBadge.tsx
// Fiyatlandırma modeli badge bileşeni

interface PricingBadgeProps {
  pricingModelSlug: string | null | undefined;
  startingPrice: number | null | undefined;
  currency?: string;
  hasFreeTrial?: boolean;
  size?: "xs" | "sm" | "md";
}

const MODEL_LABELS: Record<string, string> = {
  free: "Free",
  "open-source": "Open Source",
  freemium: "Freemium",
  subscription: "Subscription",
  "one-time": "One-Time",
  "usage-based": "Pay as you go",
  enterprise: "Enterprise",
  "free-trial": "Free Trial",
  paid: "Paid",
};

const MODEL_COLORS: Record<string, string> = {
  free: "badge-free",
  "open-source": "badge-oss",
  freemium: "badge-freemium",
  subscription: "badge-subscription",
  "one-time": "badge-onetime",
  "usage-based": "badge-usage",
  enterprise: "badge-enterprise",
  paid: "badge-paid",
};

export function PricingBadge({
  pricingModelSlug,
  startingPrice,
  currency = "USD",
  hasFreeTrial = false,
  size = "sm",
}: PricingBadgeProps) {
  const slug = pricingModelSlug ?? "paid";
  const label = MODEL_LABELS[slug] ?? "Paid";
  const colorClass = MODEL_COLORS[slug] ?? "badge-paid";
  const sizeClass = `badge-${size}`;

  const priceText =
    startingPrice !== null && startingPrice !== undefined && startingPrice > 0
      ? `from $${startingPrice}/mo`
      : null;

  return (
    <div className="pricing-badge-wrapper">
      <span
        className={`pricing-badge ${colorClass} ${sizeClass}`}
        title={priceText ?? label}
      >
        {label}
      </span>
      {priceText && size !== "xs" && (
        <span className="pricing-price">{priceText}</span>
      )}
      {hasFreeTrial && size !== "xs" && (
        <span className="pricing-trial">Free trial</span>
      )}
    </div>
  );
}
