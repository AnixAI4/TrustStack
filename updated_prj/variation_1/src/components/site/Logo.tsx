import { cn } from "@/lib/cn";

export function Logo({
  size = 34,
  className,
  withWordmark = true,
}: {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="ts-mark" x1="0" y1="0" x2="40" y2="40">
            <stop stopColor="var(--accent-soft)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <rect
          x="2.5"
          y="2.5"
          width="35"
          height="35"
          rx="11"
          fill="url(#ts-mark)"
        />
        <path
          d="M20 9l9 3.6v6.2c0 5.6-3.8 9.5-9 11.2-5.2-1.7-9-5.6-9-11.2v-6.2L20 9z"
          fill="#0a0a0f"
          opacity=".18"
        />
        <path
          d="M20 9l9 3.6v6.2c0 5.6-3.8 9.5-9 11.2-5.2-1.7-9-5.6-9-11.2v-6.2L20 9z"
          stroke="#1a0c00"
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity=".55"
        />
        <path
          d="M15.6 20.2l3 3 6-6.2"
          stroke="#0a0a0f"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span className="font-display text-[1.05rem] font-semibold tracking-tight text-text">
          TrustStack
          <span className="align-super text-[max(0.62em,0.75rem)] text-text-faint">™</span>
        </span>
      )}
    </span>
  );
}
