import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("w-full px-6 py-5", className)}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1c1e21]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#666]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function GlassCard({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={cn("card-depth", hover && "hover-glow cursor-pointer", className)}>
      {children}
    </div>
  );
}

export function Sparkline({ data, color = "#1877f2", className }: { data: number[]; color?: string; className?: string }) {
  const w = 100;
  const h = 32;
  if (data.length < 2) return <svg viewBox={`0 0 ${w} ${h}`} className={className} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spark-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({ label, value, delta, icon: Icon, series, accent = "#1877f2", index = 0 }: {
  label: string; value: string; delta?: number; icon?: LucideIcon; series?: number[]; accent?: string; index?: number;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="card-depth hover-glow p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[#666]">{label}</p>
          <p className="mt-1 text-[22px] font-bold text-[#1c1e21]">{value}</p>
        </div>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}15`, color: accent }}>
            <Icon className="h-[16px] w-[16px]" strokeWidth={2.2} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold",
            positive ? "bg-[#e7f7e3] text-[#2e7d32]" : "bg-red-50 text-[#d32f2f]")}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}{delta.toFixed(1)}%
          </span>
        )}
        {series && series.length > 1 && <Sparkline data={series} color={accent} className="h-7 w-20" />}
      </div>
    </div>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "muted" | "primary" }) {
  const tones: Record<string, string> = {
    success: "bg-[#e7f7e3] text-[#2e7d32]",
    warning: "bg-[#fff8e1] text-[#f57f17]",
    danger: "bg-red-50 text-[#d32f2f]",
    muted: "bg-[#f0f2f5] text-[#666]",
    primary: "bg-[#e7f3ff] text-[#1877f2]",
  };
  const live = tone === "success" || tone === "primary";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium", tones[tone])}>
      <span className="relative flex h-1.5 w-1.5">
        {live && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {label}
    </span>
  );
}
