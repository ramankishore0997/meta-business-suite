import { cn } from "@/lib/utils";

type DeliveryStatus = "active" | "learning" | "off" | "error" | "not_delivering";

interface DeliveryPillProps {
  status: DeliveryStatus;
  className?: string;
}

const META: Record<
  DeliveryStatus,
  { label: string; pill: string; dot: string }
> = {
  active: {
    label: "Active",
    pill: "bg-[#e7f7e3] text-[#2e7d32]",
    dot: "bg-[#42b72a]",
  },
  learning: {
    label: "Learning",
    pill: "bg-[#fff8e1] text-[#f57f17]",
    dot: "bg-[#f5a623]",
  },
  not_delivering: {
    label: "Learning Limited",
    pill: "bg-[#fff3e0] text-[#e65100]",
    dot: "bg-[#f4511e]",
  },
  error: {
    label: "Error",
    pill: "bg-red-50 text-[#d32f2f]",
    dot: "bg-[#d32f2f]",
  },
  off: {
    label: "Paused",
    pill: "bg-[#f0f2f5] text-[#666]",
    dot: "bg-[#ccc]",
  },
};

export function DeliveryPill({ status, className }: DeliveryPillProps) {
  const m = META[status] ?? META.off;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium",
        m.pill,
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
