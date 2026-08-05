// src/components/ui/StarRating.tsx
// Yıldız rating bileşeni — erişilebilir, SVG tabanlı.
// Server Component.

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showValue?: boolean;
}

const SIZE_MAP = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
  showValue = false,
}: StarRatingProps) {
  const px = SIZE_MAP[size];
  const rounded = Math.round(rating * 2) / 2; // 0.5 adımlarla yuvarla

  return (
    <div
      className={`star-rating star-rating--${size}`}
      role="img"
      aria-label={`${rating.toFixed(1)} out of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }).map((_, i) => {
        const filled = i + 1 <= rounded;
        const halfFilled = !filled && i + 0.5 < rounded;
        const uniqueId = `star-half-${i}-${size}-${Math.round(rating * 10)}`;

        return (
          <svg
            key={i}
            width={px}
            height={px}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className={`star-icon ${filled ? "star-filled" : halfFilled ? "star-half" : "star-empty"}`}
          >
            {halfFilled && (
              <defs>
                <linearGradient id={uniqueId}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={
                filled
                  ? "currentColor"
                  : halfFilled
                  ? `url(#${uniqueId})`
                  : "none"
              }
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
      {showValue && (
        <span className="star-rating-value">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
