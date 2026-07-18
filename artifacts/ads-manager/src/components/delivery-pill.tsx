import { cn } from "@/lib/utils";

type DeliveryStatus = "active" | "learning" | "off" | "error" | "not_delivering";

interface DeliveryPillProps {
  status: DeliveryStatus;
  className?: string;
}

const META: Record<
  DeliveryStatus,
  { label: string; pill: string; dot: string; shadow: string }
> = {
  active: {
    label: "Active",
    pill: "bg-[#e7f7e3] text-[#2e7d32] border border-[#c8e6c9]",
    dot: "bg-[#42b72a]",
    shadow: "shadow-[0_1px_3px_rgba(66,183,42,0.3)]",
  },
  learning: {
    label: "Learning",
    pill: "bg-[#fff8e1] text-[#f57f17] border border-[#ffe082]",
    dot: "bg-[#f5a623]",
    shadow: "shadow-[0_1px_3px_rgba(245,166,35,0.3)]",
  },
  not_delivering: {
    label: "Learning Limited",
    pill: "bg-[#fff3e0] text-[#e65100] border border-[#ffcc80]",
    dot: "bg-[#f4511e]",
    shadow: "shadow-[0_1px_3px_rgba(244,81,30,0.3)]",
  },
  error: {
    label: "Error",
    pill: "bg-red-50 text-[#d32f2f] border border-[#ffcdd2]",
    dot: "bg-[#d32f2f]",
    shadow: "shadow-[0_1px_3px_rgba(211,47,47,0.3)]",
  },
  off: {
    label: "Paused",
    pill: "bg-[#f0f2f5] text-[#666] border border-[#e4e6eb]",
    dot: "bg-[#ccc]",
    shadow: "",
  },
};

export function DeliveryPill({ status, className }: DeliveryPillProps) {
  const m = META[status] ?? META.off;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        m.pill,
        m.shadow,
        className,
      )}
    >
      <span className={cn("relative flex h-1.5 w-1.5 items-center justify-center")}>
        {status === "active" && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", m.dot)} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", m.dot)} />
      </span>
      {m.label}
    </div>
  );
}
