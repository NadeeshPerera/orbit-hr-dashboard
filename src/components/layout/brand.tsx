import { useId } from "react";
import { cn } from "@/lib/utils";

/** Orbit logo: a planet with a ring. */
export function BrandMark({ className }: { className?: string }) {
  // Unique gradient id per instance: with a shared id, a copy inside a hidden
  // (display:none) element "owns" the gradient and the visible logos render blank.
  const gradientId = `orbit-g-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.62 0.22 290)" />
          <stop offset="1" stopColor="oklch(0.55 0.2 260)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <circle cx="16" cy="16" r="5.5" fill="white" />
      <ellipse cx="16" cy="16" rx="11" ry="4.2" fill="none" stroke="white" strokeOpacity=".75" strokeWidth="1.6" transform="rotate(-28 16 16)" />
    </svg>
  );
}

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight">
          Orbit <span className="text-muted-foreground">HR</span>
        </span>
      )}
    </span>
  );
}
