import { cn } from "@/lib/cn";

export function Marquee({
  items,
  className,
  fixed = false,
}: {
  items: string[];
  className?: string;
  fixed?: boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div
      className={cn(
        "group flex items-center overflow-hidden border-line py-4",
        fixed
          ? "marquee-fixed relative border-y bg-bg-2/50 lg:fixed lg:inset-x-0 lg:bottom-0 lg:z-40 lg:border-y-0 lg:border-t lg:bg-bg-2/85 lg:backdrop-blur"
          : "relative border-y bg-bg-2/50",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10 group-hover:[animation-play-state:paused]">
        {doubled.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.12em] text-text-muted"
          >
            {t}
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
