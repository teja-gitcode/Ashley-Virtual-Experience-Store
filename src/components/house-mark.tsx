import { cn } from "@/lib/cn";

export function HouseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      className={cn("text-orange", className)}
      aria-hidden="true"
    >
      <path
        d="M8 30 L32 10 L56 30 V50 H8 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
