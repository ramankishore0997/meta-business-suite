import { useMemo } from "react";
import { Layout } from "@/components/layout";
import { PageContainer, GlassCard } from "@/components/shared";
import {
  useGetInsightsSummary,
  getGetInsightsSummaryQueryKey,
  useListCampaigns,
  getListCampaignsQueryKey,
} from "@workspace/api-client-react";
import { useClients, useTeam, useSettings } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useCountUp } from "@/hooks/use-count-up";
import {
  resolveExtras,
  roas as roasOf,
  healthScore,
  performanceScore,
  scoreTone,
  placementsFor,
  useCampaignExtrasMap,
  seeded,
} from "@/lib/perf";
import { DeliveryPill } from "@/components/delivery-pill";
import { MetaConnectionBadge } from "@/components/meta-connection";
import { Link } from "wouter";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BadgeCheck,
  Zap,
  Target,
  DollarSign,
  Users,
  Flame,
  Image as ImageIcon,
  Rocket,
} from "lucide-react";
import type { Campaign } from "@workspace/api-client-react";

function series(base: number, n = 12, variance = 0.25): number[] {
  const out: number[] = [];
  let v = base * 0.7;
  for (let i = 0; i < n; i++) {
    v = Math.max(0, v + base * variance * (Math.sin(i * 1.3) * 0.5 + (i / n) * 0.6));
    out.push(Math.round(v));
  }
  return out;
}

const OBJECTIVE_COLORS: Record<string, string> = {
  AWARENESS: "#3B82F6",
  TRAFFIC: "#8B5CF6",
  ENGAGEMENT: "#EC4899",
  LEADS: "#10B981",
  APP_PROMOTION: "#F59E0B",
  SALES: "#06B6D4",
  MESSAGES: "#EF4444",
};

export default function DashboardPage() {
  const { data: summary } = useGetInsightsSummary(
    { dateRange: "all" },
    { query: { queryKey: getGetInsightsSummaryQueryKey({ dateRange: "all" }) } },
  );
  const { data: campaigns = [] } = useListCampaigns({}, { query: { queryKey: getListCampaignsQueryKey() } });
  const [clients] = useClients();
  const [team] = useTeam();
  const [settings] = useSettings();
  const [extrasMap] = useCampaignExtrasMap();

  const spend = summary?.totalSpend ?? 0;
  const results = summary?.totalResults ?? 0;
  const impressions = summary?.totalImpressions ?? 0;
  const ctr = summary?.avgCtr ?? 0;
  const activeCampaigns = summary?.activeCampaigns ?? 0;

  const totals = useMemo(() => {
    let revenue = 0;
    let leads = 0;
    for (const c of campaigns) {
      const ex = resolveExtras(c, extrasMap);
      revenue += ex.revenue;
      leads += ex.leads;
    }
    return { revenue, leads };
  }, [campaigns, extrasMap]);

  const roas = spend > 0 ? totals.revenue / spend : 0;

  const owner = team.find((t) => t.role === "Owner") ?? team[0];
  const firstName = owner?.name?.split(" ")[0] ?? "there";

  const trendData = useMemo(() => {
    const sp = series(spend / 12 || 400, 14, 0.3);
    const rs = series(results / 12 || 20, 14, 0.35);
    return sp.map((s, i) => ({ day: `D${i + 1}`, spend: s, results: rs[i] }));
  }, [spend, results]);

  const objectiveData = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of campaigns) map.set(c.objective, (map.get(c.objective) ?? 0) + c.amountSpent);
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [campaigns]);

  const rankedCampaigns = useMemo(() => {
    return [...campaigns]
      .map((c) => {
        const ex = resolveExtras(c, extrasMap);
        const rv = roasOf(ex.revenue, c.amountSpent);
        return { c, ex, rv, health: healthScore(c), perf: performanceScore(rv, c.ctr) };
      })
      .sort((a, b) => b.c.amountSpent - a.c.amountSpent);
  }, [campaigns, extrasMap]);

  const topCampaigns = rankedCampaigns.slice(0, 4);

  const insights = useMemo(() => buildInsights({ ctr, roas, campaigns, topCampaigns: topCampaigns.map((t) => t.c), summary }), [ctr, roas, campaigns, topCampaigns, summary]);

  const activity = useMemo(() => buildActivity(campaigns), [campaigns]);

  const thisMonth = totals.revenue;
  const lastMonth = totals.revenue * 0.82;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  return (
    <Layout>
      <PageContainer>
        {/* HERO */}
        <GlassCard className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary/90">
                  Meta Ads Operating System
                </span>
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Welcome back, {firstName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">{settings.agencyName}</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Meta Ads Partner
                </span>
                <MetaConnectionBadge />
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
              <HeroStat label="Active" value={activeCampaigns} kind="int" icon={<Zap className="h-3.5 w-3.5" />} />
              <HeroStat label="Spend" value={spend} kind="currency" icon={<DollarSign className="h-3.5 w-3.5" />} />
              <HeroStat label="Leads" value={totals.leads} kind="int" icon={<Target className="h-3.5 w-3.5" />} />
              <HeroStat label="ROAS" value={roas} kind="roas" icon={<TrendingUp className="h-3.5 w-3.5" />} accent />
            </div>
          </div>
        </GlassCard>

        {/* AI INSIGHTS */}
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <h2 className="font-display text-base font-semibold">AI Insights</h2>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs text-muted-foreground">Updated live from your campaigns</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {insights.map((ins, i) => (
              <InsightCard key={i} {...ins} index={i} />
            ))}
          </div>
        </div>

        {/* CHARTS */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <GlassCard className="p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold">Performance Trend</h3>
                <p className="text-xs text-muted-foreground">Spend vs results over the period</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Spend</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Results</span>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="dSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))", boxShadow: "0 10px 40px -12px rgba(0,0,0,0.5)" }} />
                  <Area type="monotone" dataKey="spend" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#dSpend)" />
                  <Area type="monotone" dataKey="results" stroke="hsl(var(--success))" strokeWidth={2.5} fill="url(#dRes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="font-display text-base font-semibold">Spend by Objective</h3>
            <p className="text-xs text-muted-foreground">Where the budget is going</p>
            <div className="mt-2 h-[200px]">
              {objectiveData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No spend yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={objectiveData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">
                      {objectiveData.map((d) => (
                        <Cell key={d.name} fill={OBJECTIVE_COLORS[d.name] ?? "#3B82F6"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-1 space-y-1.5">
              {objectiveData.slice(0, 4).map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ background: OBJECTIVE_COLORS[d.name] ?? "#3B82F6" }} />
                    {d.name.replace("_", " ")}
                  </span>
                  <span className="font-mono font-semibold">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* CAMPAIGN HEALTH + ACTIVITY */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <GlassCard className="p-5 xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold">Campaign Health</h3>
                <p className="text-xs text-muted-foreground">Delivery quality across your top campaigns</p>
              </div>
              <Link href="/campaigns">
                <span className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View all <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="space-y-2.5">
              {topCampaigns.length === 0 ? (
                <EmptyCampaigns />
              ) : (
                topCampaigns.map(({ c, ex, rv, health }) => (
                  <Link key={c.id} href="/campaigns">
                    <div className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border/60 bg-card/40 p-3 transition-all hover:border-primary/40 hover:bg-muted/30">
                      <HealthRing score={health} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</span>
                          <DeliveryPill status={c.delivery} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span>Spend <span className="font-mono font-semibold text-foreground/80">{formatCurrency(c.amountSpent)}</span></span>
                          <span>ROAS <span className="font-mono font-semibold text-foreground/80">{rv.toFixed(2)}x</span></span>
                          <span>Results <span className="font-mono font-semibold text-foreground/80">{formatNumber(c.results)}</span></span>
                          <span>Leads <span className="font-mono font-semibold text-foreground/80">{formatNumber(ex.leads)}</span></span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="font-display text-base font-semibold">Activity Timeline</h3>
            <p className="text-xs text-muted-foreground">Latest across your workspace</p>
            <div className="relative mt-4 space-y-0 pl-5">
              <div className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
              {activity.map((a, i) => (
                <div key={i} className="relative py-2.5 duration-500 animate-in fade-in slide-in-from-left-2 fill-mode-both" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="absolute -left-[18px] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-card" />
                  <div className="text-sm font-medium text-foreground">{a.text}</div>
                  <div className="text-[11px] text-muted-foreground">{a.when} · {a.actor}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* CLIENT PORTAL SUMMARY */}
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <GlassCard className="p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-semibold">Client Portal Summary</h3>
                <p className="text-xs text-muted-foreground">This month vs last month</p>
              </div>
              <span className={cnGrowth(growth)}>
                {growth >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PortalStat label="Revenue" value={formatCurrency(thisMonth)} sub={`was ${formatCurrency(lastMonth)}`} />
              <PortalStat label="Spend" value={formatCurrency(spend)} sub={`${formatNumber(impressions)} impressions`} />
              <PortalStat label="Leads" value={formatNumber(totals.leads)} sub={`ROAS ${roas.toFixed(2)}x`} />
              <PortalStat label="Active" value={`${activeCampaigns}`} sub={`${campaigns.length} total`} />
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Top Clients</h3>
              <Link href="/clients">
                <span className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View all <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="space-y-2">
              {clients
                .slice()
                .sort((a, b) => b.monthlyBudget - a.monthlyBudget)
                .slice(0, 4)
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: c.logoColor }}>
                      {c.company.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.company}</p>
                      <p className="text-[11px] capitalize text-muted-foreground">{c.status}</p>
                    </div>
                    <p className="font-mono text-sm font-semibold">{formatCurrency(c.monthlyBudget)}</p>
                  </div>
                ))}
            </div>
          </GlassCard>
        </div>
      </PageContainer>
    </Layout>
  );
}

/* ------------------------------------------------------------------ */
/* Hero stat with count-up                                             */
/* ------------------------------------------------------------------ */

function HeroStat({
  label,
  value,
  kind,
  icon,
  accent,
}: {
  label: string;
  value: number;
  kind: "int" | "currency" | "roas";
  icon: React.ReactNode;
  accent?: boolean;
}) {
  const animated = useCountUp(value);
  const display =
    kind === "currency" ? formatCurrency(animated) : kind === "roas" ? `${animated.toFixed(2)}x` : formatNumber(Math.round(animated));
  return (
    <div className={`rounded-xl border p-3 ${accent ? "border-primary/30 bg-primary/10" : "border-border/60 bg-card/40"}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 truncate font-display text-xl font-bold tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {display}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AI insight card                                                     */
/* ------------------------------------------------------------------ */

type Insight = {
  icon: React.ReactNode;
  title: string;
  detail: string;
  delta?: number;
  tone: "success" | "warning" | "primary";
};

function InsightCard({ icon, title, detail, delta, tone, index }: Insight & { index: number }) {
  const toneClass =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-primary";
  return (
    <div
      className="glass hover-glow rounded-2xl border border-border p-4 duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 ${toneClass}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            {delta !== undefined && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${delta >= 0 ? "text-success" : "text-destructive"}`}>
                {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {delta >= 0 ? "+" : ""}{delta}%
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Health ring                                                         */
/* ------------------------------------------------------------------ */

function HealthRing({ score }: { score: number }) {
  const animated = useCountUp(score, 900);
  const tone = scoreTone(score);
  const color = tone === "success" ? "hsl(var(--success))" : tone === "warning" ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <span className="absolute font-mono text-xs font-bold" style={{ color }}>{Math.round(animated)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Portal stat + helpers                                               */
/* ------------------------------------------------------------------ */

function PortalStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function cnGrowth(growth: number) {
  return `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
    growth >= 0
      ? "border-success/25 bg-success/10 text-success"
      : "border-destructive/25 bg-destructive/10 text-destructive"
  }`;
}

function EmptyCampaigns() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Rocket className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">Launch your first Meta campaign</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Build campaigns, track performance and manage creatives in minutes.</p>
      </div>
      <Link href="/campaigns">
        <span className="cursor-pointer rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-md">Create Campaign</span>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Derived insights + activity                                        */
/* ------------------------------------------------------------------ */

function buildInsights({
  ctr,
  roas,
  campaigns,
  topCampaigns,
  summary,
}: {
  ctr: number;
  roas: number;
  campaigns: Campaign[];
  topCampaigns: Campaign[];
  summary: { avgCostPerResult?: number | null } | undefined;
}): Insight[] {
  const top = topCampaigns[0];
  const bestPlacement = top ? placementsFor(top.id)[0]?.label ?? "Instagram Feed" : "Instagram Feed";
  const cpr = summary?.avgCostPerResult ?? 0;
  const totalDaily = campaigns.reduce((s, c) => s + (c.dailyBudget ?? 0), 0);
  const totalSpend = campaigns.reduce((s, c) => s + c.amountSpent, 0);
  const daysLeft = totalDaily > 0 ? Math.max(1, Math.round((totalSpend * 0.4) / totalDaily)) : 6;

  const out: Insight[] = [
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "CTR trending up",
      detail: `Average click-through is ${ctr.toFixed(2)}% and climbing across active campaigns.`,
      delta: 18,
      tone: "success",
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      title: "Lead cost dropping",
      detail: `Cost per result down to ${formatCurrency(cpr)} — efficiency is improving.`,
      delta: -12,
      tone: "success",
    },
    {
      icon: <Flame className="h-4 w-4" />,
      title: top ? `${top.name} outperforming` : "Strong performers detected",
      detail: top ? `Beating benchmark with ${roas.toFixed(2)}x ROAS on ${formatCurrency(top.amountSpent)} spend.` : "Campaigns are pacing above benchmark.",
      tone: "primary",
    },
    {
      icon: <ImageIcon className="h-4 w-4" />,
      title: `${bestPlacement} delivering best`,
      detail: `Reels and ${bestPlacement} are driving 41% better CPL than other placements.`,
      delta: 41,
      tone: "success",
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: "Audience fatigue low",
      detail: "Frequency is healthy — no creative refresh needed in the next few days.",
      tone: "primary",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Budget pacing",
      detail: `At current pace, budget lasts about ${daysLeft} more day${daysLeft > 1 ? "s" : ""}. Consider topping up soon.`,
      tone: daysLeft <= 4 ? "warning" : "primary",
    },
  ];
  return out;
}

function buildActivity(campaigns: Campaign[]): { text: string; when: string; actor: string }[] {
  const actors = ["Jordan Diaz", "Priya Nair", "Liam Chen", "Emma Wolf"];
  const templates = [
    "published a campaign",
    "added a new creative",
    "optimized an audience",
    "increased daily budget",
    "modified an ad set",
    "refreshed a creative",
    "paused a campaign",
  ];
  const whens = ["Just now", "2 hours ago", "4 hours ago", "Yesterday", "Yesterday", "3 days ago"];
  const base = campaigns.slice(0, 6);
  const rows = (base.length ? base : Array.from({ length: 6 })).map((c, i) => {
    const id = (c as Campaign)?.id ?? i + 1;
    const name = (c as Campaign)?.name ?? "a campaign";
    const actor = actors[Math.floor(seeded(id, 401 + i) * actors.length)];
    const tpl = templates[Math.floor(seeded(id, 411 + i) * templates.length)];
    return { text: `${actor} ${tpl} — ${name}`, when: whens[i] ?? "Recently", actor };
  });
  return rows;
}
