import { cn } from "@/lib/utils";

type DeliveryStatus = "active" | "learning" | "off" | "error" | "not_delivering";

interface DeliveryPillProps {
  status: DeliveryStatus;
  className?: string;
}

/**
 * Meta-style delivery badge. Maps the five backend delivery states onto
 * Meta Ads Manager's visual language (gradient pill + glowing status dot).
 * Purely presentational — no state that can't occur is invented.
 */
const META: Record<
  DeliveryStatus,
  { label: string; pill: string; dot: string; glow: string }
> = {
  active: {
    label: "Delivering",
    pill: "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.7)]",
  },
  learning: {
    label: "Learning",
    pill: "bg-gradient-to-r from-amber-400/20 to-amber-400/5 text-amber-300 border-amber-400/30",
    dot: "bg-amber-300",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  },
  not_delivering: {
    label: "Learning Limited",
    pill: "bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-300 border-orange-500/30",
    dot: "bg-orange-400",
    glow: "shadow-[0_0_8px_rgba(249,115,22,0.6)]",
  },
  error: {
    label: "Error",
    pill: "bg-gradient-to-r from-red-500/20 to-red-500/5 text-red-400 border-red-500/30",
    dot: "bg-red-500",
    glow: "shadow-[0_0_8px_rgba(239,68,68,0.7)]",
  },
  off: {
    label: "Paused",
    pill: "bg-gradient-to-r from-slate-500/15 to-slate-500/5 text-slate-300 border-slate-400/20",
    dot: "bg-slate-400",
    glow: "",
  },
};

export function DeliveryPill({ status, className }: DeliveryPillProps) {
  const m = META[status] ?? META.off;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm",
        m.pill,
        className,
      )}
    >
      <span className={cn("relative flex h-1.5 w-1.5 items-center justify-center")}>
        {status === "active" && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", m.dot)} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", m.dot, m.glow)} />
      </span>
      {m.label}
    </div>
  );
}
