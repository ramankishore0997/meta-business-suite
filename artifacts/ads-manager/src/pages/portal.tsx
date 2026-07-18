import { useMemo } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { PageContainer, GlassCard } from "@/components/shared";
import { MetaConnectionBadge } from "@/components/meta-connection";
import { DeliveryPill } from "@/components/delivery-pill";
import {
  useClients,
  useGoals,
  useOptimizations,
  useCreatives,
  useSettings,
  useLocalStore,
} from "@/lib/store";
import {
  useListCampaigns,
  getListCampaignsQueryKey,
  useListAds,
  getListAdsQueryKey,
} from "@workspace/api-client-react";
import {
  resolveExtras,
  useCampaignExtrasMap,
  roas,
  seeded,
  healthScore,
  scoreTone,
  creativeKind,
} from "@/lib/perf";
import { formatCurrency, formatNumber, mediaSrc } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Printer,
  ShieldCheck,
  Target,
  Wrench,
  Sparkles,
  TrendingUp,
  Check,
  ArrowUpRight,
  Play,
} from "lucide-react";

const TONE: Record<string, string> = {
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
};
const BAR: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export default function PortalPage() {
  const [clients] = useClients();
  const [goals] = useGoals();
  const [optimizations] = useOptimizations();
  const [creatives] = useCreatives();
  const [settings] = useSettings();
  const [activeClientId, setActiveClientId] = useLocalStore<string>("activeClientId", "all");

  const { data: campaigns = [] } = useListCampaigns({}, { query: { queryKey: getListCampaignsQueryKey() } });
  const { data: ads = [] } = useListAds({}, { query: { queryKey: getListAdsQueryKey() } });
  const [extrasMap] = useCampaignExtrasMap();

  const selectedClient = clients.find((c) => c.id === activeClientId) ?? null;

  function clientOf(campaignId: number): string {
    if (!clients.length) return "";
    return clients[Math.floor(seeded(campaignId, 5) * clients.length)].id;
  }

  const scoped = useMemo(
    () => (selectedClient ? campaigns.filter((c) => clientOf(c.id) === selectedClient.id) : campaigns),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaigns, selectedClient, clients],
  );

  const totals = useMemo(() => {
    let spend = 0, results = 0, leads = 0, revenue = 0, activeCount = 0;
    for (const c of scoped) {
      const ex = resolveExtras(c, extrasMap);
      spend += c.amountSpent;
      results += c.results;
      leads += ex.leads;
      revenue += ex.revenue;
      if (c.delivery === "active") activeCount += 1;
    }
    return { spend, results, leads, revenue, activeCount, roasVal: roas(revenue, spend) };
  }, [scoped, extrasMap]);

  const actualFor = (metric: string) =>
    metric === "leads" ? totals.leads
    : metric === "revenue" ? totals.revenue
    : metric === "spend" ? totals.spend
    : totals.roasVal;

  const topSpend = useMemo(
    () => [...scoped].sort((a, b) => b.amountSpent - a.amountSpent).slice(0, 6),
    [scoped],
  );
  const maxSpend = Math.max(1, ...topSpend.map((c) => c.amountSpent));

  const highlightCreatives = useMemo(() => {
    const fromAds = ads
      .filter((a) => a.mediaUrl && a.mediaUrl.trim())
      .map((a) => ({ id: `a${a.id}`, title: a.name, url: a.mediaUrl as string, kind: creativeKind(a.mediaUrl, a.format) }));
    const fromStore = creatives.map((c) => ({ id: c.id, title: c.title, url: c.url, kind: creativeKind(c.url) }));
    return [...fromStore, ...fromAds].slice(0, 4);
  }, [ads, creatives]);

  const managementFee = Math.round(totals.spend * 0.15);
  const reportPeriod = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const clientName = selectedClient ? selectedClient.company : "All Clients";

  return (
    <Layout>
      <style>{`@media print {
        aside, header { display: none !important; }
        .no-print { display: none !important; }
        .app-aurora::before, .app-aurora::after { display: none !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }`}</style>
      <PageContainer>
        {/* Controls (not printed) */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Viewing as</span>
            <select
              value={activeClientId}
              onChange={(e) => setActiveClientId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company}</option>
              ))}
            </select>
          </div>
          <Button onClick={() => window.print()} className="h-9 gap-2 rounded-xl font-semibold">
            <Printer className="h-4 w-4" /> Export report (PDF)
          </Button>
        </div>

        {/* White-label report header */}
        <GlassCard className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-border/60 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${selectedClient?.logoColor ?? "#3B82F6"}, #6366F1)` }}
              >
                {(settings.agencyName || "N").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-foreground">{settings.agencyName}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <ShieldCheck className="h-3 w-3" /> Meta Partner
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Performance report for <span className="font-semibold text-foreground">{clientName}</span> · {reportPeriod}
                </p>
              </div>
            </div>
            <MetaConnectionBadge />
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-px bg-border/60 md:grid-cols-3 xl:grid-cols-6">
            <Summary label="Ad Spend" value={formatCurrency(totals.spend)} />
            <Summary label="Leads" value={formatNumber(totals.leads)} />
            <Summary label="Revenue" value={formatCurrency(totals.revenue)} />
            <Summary label="ROAS" value={`${totals.roasVal.toFixed(2)}x`} accent />
            <Summary label="Results" value={formatNumber(totals.results)} />
            <Summary label="Active Campaigns" value={String(totals.activeCount)} />
          </div>
        </GlassCard>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Goals vs Actual */}
          <GlassCard className="p-5">
            <SectionTitle icon={Target} title="Goals vs Actual" hint="Progress toward this month's targets" />
            <div className="mt-4 space-y-4">
              {goals.map((g) => {
                const actual = actualFor(g.metric);
                const pct = Math.min(100, Math.round((actual / g.target) * 100));
                const done = pct >= 100;
                const fmt = (n: number) =>
                  g.metric === "revenue" || g.metric === "spend" ? formatCurrency(n)
                  : g.metric === "roas" ? `${n.toFixed(2)}x`
                  : formatNumber(n);
                return (
                  <div key={g.id}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-foreground">{g.label}</span>
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{fmt(actual)}</span> / {fmt(g.target)}
                      </span>
                    </div>
                    <div className="relative h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${done ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className={done ? "font-semibold text-emerald-400" : "text-muted-foreground"}>
                        {done ? "Goal reached" : `${pct}% complete`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Transparent spend breakdown */}
          <GlassCard className="p-5">
            <SectionTitle icon={ShieldCheck} title="Transparent Spend Breakdown" hint="Exactly where your budget goes" />
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
              <Check className="h-4 w-4 shrink-0" />
              <span>100% of your ad budget is paid directly to Meta. No hidden markup on spend.</span>
            </div>
            <div className="mt-4 space-y-3">
              {topSpend.map((c) => (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate pr-2 font-medium text-foreground">{c.name}</span>
                    <span className="shrink-0 font-semibold text-foreground">{formatCurrency(c.amountSpent)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/80 transition-all duration-700" style={{ width: `${(c.amountSpent / maxSpend) * 100}%` }} />
                  </div>
                </div>
              ))}
              {topSpend.length === 0 && <p className="text-sm text-muted-foreground">No spend recorded yet.</p>}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-border/60 pt-4 text-sm">
              <Row label="Ad spend (paid to Meta)" value={formatCurrency(totals.spend)} />
              <Row label="Agency management (15%, per contract)" value={formatCurrency(managementFee)} muted />
              <Row label="Total client investment" value={formatCurrency(totals.spend + managementFee)} bold />
            </div>
          </GlassCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Optimization log */}
          <GlassCard className="p-5">
            <SectionTitle icon={Wrench} title="What We Did For You" hint="Recent proactive optimizations" />
            <div className="mt-4 space-y-3">
              {optimizations.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground">{o.action}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{o.date} · {o.by}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/12 px-2 py-1 text-[11px] font-bold text-emerald-400">{o.impact}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Creative highlights */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <SectionTitle icon={Sparkles} title="Creative Highlights" hint="Live ads running in your account" />
              <Link href="/creatives" className="no-print">
                <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-lg text-xs">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            {highlightCreatives.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No creatives added yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {highlightCreatives.map((c) => (
                  <div key={c.id} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/40">
                    {c.kind === "video" ? (
                      <>
                        <video src={mediaSrc(c.url)} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
                            <Play className="h-4 w-4" fill="currentColor" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <img src={mediaSrc(c.url)} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Campaign performance */}
        <GlassCard className="mt-4 p-5">
          <SectionTitle icon={TrendingUp} title="Campaign Performance" hint={`${scoped.length} campaign${scoped.length === 1 ? "" : "s"} in this report`} />
          <div className="mt-4 space-y-2">
            {scoped.slice(0, 10).map((c) => {
              const ex = resolveExtras(c, extrasMap);
              const rv = roas(ex.revenue, c.amountSpent);
              const hs = healthScore(c);
              const tone = scoreTone(hs);
              return (
                <div key={c.id} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/40 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                      <DeliveryPill status={c.delivery} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatNumber(ex.leads)} leads · {formatNumber(c.results)} results</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Spend</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(c.amountSpent)}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">ROAS</p>
                    <p className="text-sm font-semibold text-foreground">{rv.toFixed(2)}x</p>
                  </div>
                  <div className="w-14 text-right">
                    <p className={`text-lg font-bold ${TONE[tone]}`}>{hs}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${BAR[tone]}`} style={{ width: `${hs}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {scoped.length === 0 && <p className="text-sm text-muted-foreground">No campaigns for this client yet.</p>}
          </div>
        </GlassCard>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Prepared by {settings.agencyName} · Data synced live from Meta Business · {reportPeriod}
        </p>
      </PageContainer>
    </Layout>
  );
}

function Summary({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card/60 p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, hint }: { icon: typeof Target; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div>
        <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : bold ? "font-semibold text-foreground" : "text-foreground"}>{label}</span>
      <span className={bold ? "font-bold text-foreground" : muted ? "text-muted-foreground" : "font-semibold text-foreground"}>{value}</span>
    </div>
  );
}
