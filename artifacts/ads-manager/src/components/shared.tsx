import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

/** Scroll container + ambient aurora backdrop for every page body. */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar app-aurora">
      <div className={cn("mx-auto w-full max-w-[1600px] px-5 py-6 md:px-8 md:py-8", className)}>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-in fade-in slide-in-from-top-2 duration-500">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-[28px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-strong rounded-2xl shadow-[0_4px_30px_-12px_rgba(0,0,0,0.5)]",
        hover && "hover-glow",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Minimal inline sparkline built from a numeric series. */
export function Sparkline({
  data,
  color = "hsl(var(--primary))",
  className,
}: {
  data: number[];
  color?: string;
  className?: string;
}) {
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
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  series,
  accent = "hsl(var(--primary))",
  index = 0,
}: {
  label: string;
  value: string;
  delta?: number;
  icon?: LucideIcon;
  series?: number[];
  accent?: string;
  index?: number;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <GlassCard
      hover
      className="group relative overflow-hidden p-5 animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
    >
      {/* A single, quiet accent wash — top-lit, not a glowing blob. */}
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full opacity-[0.10] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.16]"
        style={{ background: accent, animationDelay: `${index * 60}ms` }}
      />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
          <p className="tabular mt-2 font-display text-[26px] font-bold leading-none tracking-tight text-foreground">{value}</p>
        </div>
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/5"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </div>
        )}
      </div>
      <div className="relative mt-4 flex items-end justify-between gap-3">
        {delta !== undefined && (
          <span
            className={cn(
              "tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
              positive ? "bg-success/10 text-success ring-success/15" : "bg-destructive/10 text-destructive ring-destructive/15"
            )}
          >
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
        {series && series.length > 1 && (
          <Sparkline data={series} color={accent} className="h-8 w-24" />
        )}
      </div>
    </GlassCard>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "muted" | "primary";
}) {
  const tones: Record<string, string> = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
  };
  const live = tone === "success" || tone === "primary";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        tones[tone]
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {live && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {label}
    </span>
  );
}
