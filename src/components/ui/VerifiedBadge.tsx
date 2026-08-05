// src/components/ui/VerifiedBadge.tsx
// Onaylanmış yazılım / kullanıcı rozeti.
// Server Component.

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`verified-badge ${className}`}
      title="Verified by AppAlter team"
      aria-label="Verified"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="verified-icon"
      >
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" />
      </svg>
    </div>
  );
}
