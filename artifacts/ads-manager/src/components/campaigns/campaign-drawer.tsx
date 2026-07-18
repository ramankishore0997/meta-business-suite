import { useEffect, useMemo, useState } from "react";
import {
  useListCampaigns,
  getListCampaignsQueryKey,
  useListAdSets,
  getListAdSetsQueryKey,
  useListAds,
  getListAdsQueryKey,
} from "@workspace/api-client-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStore, uid } from "@/lib/store";
import { useCampaignsUI } from "./context";
import { ObjectiveBadge } from "./objectives";
import { AdSetBlock } from "./adset-block";
import { AdCard } from "./ad-card";
import { CreativePreview } from "./creative-preview";
import { DeliveryPill } from "@/components/delivery-pill";
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import {
  cpc,
  roas,
  cpl,
  healthScore,
  performanceScore,
  scoreTone,
  placementsFor,
  resolveExtras,
  formatRoas,
  seeded,
  useCampaignExtrasMap,
  type AdComment,
} from "@/lib/perf";
import { cn } from "@/lib/utils";
import {
  X,
  Layers,
  LayoutGrid,
  Activity,
  ImageIcon,
  History as HistoryIcon,
  MessageSquare,
  LayoutDashboard,
  SlidersHorizontal,
  Send,
  TrendingUp,
} from "lucide-react";
import type { Ad } from "@workspace/api-client-react";

export function CampaignDrawer({ onEditAd }: { onEditAd: (ad: Ad) => void }) {
  const { drawerCampaignId, closeDrawer, openPerf } = useCampaignsUI();
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (drawerCampaignId != null) setTab("overview");
  }, [drawerCampaignId]);

  const { data: campaigns = [] } = useListCampaigns({}, { query: { queryKey: getListCampaignsQueryKey() } });
  const open = drawerCampaignId != null;
  const { data: allAdsets = [] } = useListAdSets({}, { query: { queryKey: getListAdSetsQueryKey(), enabled: open } });
  const { data: allAds = [] } = useListAds({}, { query: { queryKey: getListAdsQueryKey(), enabled: open } });

  const [extrasMap] = useCampaignExtrasMap();

  const campaign = campaigns.find((c) => c.id === drawerCampaignId) ?? null;
  const adsets = useMemo(
    () => allAdsets.filter((a) => a.campaignId === drawerCampaignId),
    [allAdsets, drawerCampaignId],
  );
  const ads = useMemo(
    () => allAds.filter((a) => a.campaignId === drawerCampaignId),
    [allAds, drawerCampaignId],
  );

  if (!campaign) return null;

  const extras = resolveExtras(campaign, extrasMap);
  const roasVal = roas(extras.revenue, campaign.amountSpent);
  const health = healthScore(campaign);
  const perf = performanceScore(roasVal, campaign.ctr);
  const placements = placementsFor(campaign.id);

  const TABS = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "adsets", label: `Ad Sets (${adsets.length})`, icon: Layers },
    { key: "ads", label: `Ads (${ads.length})`, icon: LayoutGrid },
    { key: "performance", label: "Performance", icon: Activity },
    { key: "creative", label: "Creative", icon: ImageIcon },
    { key: "history", label: "History", icon: HistoryIcon },
    { key: "comments", label: "Comments", icon: MessageSquare },
  ];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeDrawer()}>
      <SheetContent
        side="right"
        className="flex w-[90vw] max-w-[90vw] flex-col gap-0 border-l border-border bg-card/95 p-0 backdrop-blur-2xl sm:max-w-[90vw]"
      >
        {/* Header */}
        <div className="app-aurora shrink-0 border-b border-border/60 px-7 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">{campaign.name}</h2>
                <ObjectiveBadge objective={campaign.objective} size="md" />
                <DeliveryPill status={campaign.delivery} />
                {campaign.abTestEnabled && (
                  <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                    A/B Test
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {placements.map((p) => (
                  <span key={p.key} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => openPerf(campaign.id)}>
                <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                Performance Controls
              </Button>
              <button
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
          <TabsList className="h-auto w-full shrink-0 justify-start gap-1 rounded-none border-b border-border/60 bg-transparent px-5 py-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.key}
                  value={t.key}
                  className="gap-1.5 rounded-none border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-7 py-6">
            <TabsContent value="overview" className="mt-0">
              <Overview
                campaign={campaign}
                revenue={extras.revenue}
                leads={extras.leads}
                purchases={extras.purchases}
                roasVal={roasVal}
                health={health}
                perf={perf}
                tags={extras.tags}
                manager={extras.manager}
                adsetsCount={adsets.length}
                adsCount={ads.length}
              />
            </TabsContent>

            <TabsContent value="adsets" className="mt-0 space-y-3">
              {adsets.length === 0 ? (
                <Empty icon={<Layers className="h-6 w-6" />} text="No ad sets in this campaign yet." />
              ) : (
                adsets.map((a) => <AdSetBlock key={a.id} adset={a} onEditAd={onEditAd} />)
              )}
            </TabsContent>

            <TabsContent value="ads" className="mt-0">
              {ads.length === 0 ? (
                <Empty icon={<LayoutGrid className="h-6 w-6" />} text="No ads in this campaign yet." />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ads.map((ad) => (
                    <AdCard key={ad.id} ad={ad} onEdit={onEditAd} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="mt-0">
              <Performance campaign={campaign} revenue={extras.revenue} leads={extras.leads} roasVal={roasVal} onOpenPerf={() => openPerf(campaign.id)} />
            </TabsContent>

            <TabsContent value="creative" className="mt-0">
              {ads.length === 0 ? (
                <Empty icon={<ImageIcon className="h-6 w-6" />} text="No creatives to show yet." />
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {ads.map((ad) => (
                    <div key={ad.id} className="space-y-2">
                      <CreativePreview url={ad.mediaUrl} format={ad.format} className="aspect-square w-full" />
                      <div className="truncate text-xs font-medium text-foreground">{ad.name}</div>
                      <div className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{ad.format}</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <ChangeHistory campaign={campaign} />
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <CampaignComments campaignId={campaign.id} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------- */

function Overview({
  campaign,
  revenue,
  leads,
  purchases,
  roasVal,
  health,
  perf,
  tags,
  manager,
  adsetsCount,
  adsCount,
}: {
  campaign: import("@workspace/api-client-react").Campaign;
  revenue: number;
  leads: number;
  purchases: number;
  roasVal: number;
  health: number;
  perf: number;
  tags: string[];
  manager: string;
  adsetsCount: number;
  adsCount: number;
}) {
  const budget = campaign.dailyBudget ?? campaign.totalBudget ?? null;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BigStat label="Spend" value={formatCurrency(campaign.amountSpent)} accent />
        <BigStat label="Revenue" value={formatCurrency(revenue)} />
        <BigStat label="ROAS" value={formatRoas(roasVal)} tone={scoreTone(roasVal >= 2 ? 80 : roasVal >= 1 ? 55 : 30)} />
        <BigStat label="Results" value={formatNumber(campaign.results)} />
        <BigStat label="Cost / Result" value={formatCurrency(campaign.costPerResult)} />
        <BigStat label="CPL" value={formatCurrency(cpl(campaign.amountSpent, leads))} />
        <BigStat label="CTR" value={`${(campaign.ctr ?? 0).toFixed(2)}%`} />
        <BigStat label="Reach" value={formatNumber(campaign.reach)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ScoreCard label="Health Score" score={health} hint="Delivery quality from CTR, frequency and status." />
        <ScoreCard label="Performance" score={perf} hint="Blended ROAS and click-through strength." />
        <div className="glass rounded-2xl border border-border p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Structure</div>
          <div className="mt-2 flex items-center gap-5">
            <div>
              <div className="font-mono text-2xl font-bold text-foreground">{adsetsCount}</div>
              <div className="text-xs text-muted-foreground">Ad sets</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-foreground">{adsCount}</div>
              <div className="text-xs text-muted-foreground">Ads</div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-foreground">{formatNumber(purchases)}</div>
              <div className="text-xs text-muted-foreground">Purchases</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="glass rounded-2xl border border-border p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Details</div>
          <dl className="space-y-2 text-sm">
            <Row label="Objective"><ObjectiveBadge objective={campaign.objective} /></Row>
            <Row label="Buying type"><span className="text-foreground">{campaign.buyingType ?? "Auction"}</span></Row>
            <Row label="Budget">
              <span className="text-foreground">
                {budget != null ? `${formatCurrency(budget)} ${campaign.dailyBudget != null ? "/ day" : "lifetime"}` : "—"}
              </span>
            </Row>
            <Row label="Manager"><span className="text-foreground">{manager}</span></Row>
            <Row label="Created"><span className="text-foreground">{formatDate(campaign.createdAt)}</span></Row>
            <Row label="Schedule"><span className="text-foreground">{campaign.endDate ? `Ends ${formatDate(campaign.endDate)}` : "Ongoing"}</span></Row>
          </dl>
        </div>

        <div className="glass rounded-2xl border border-border p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</div>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 ? (
              <span className="text-sm text-muted-foreground">No tags</span>
            ) : (
              tags.map((t) => (
                <span key={t} className="rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  #{t}
                </span>
              ))
            )}
          </div>
          {campaign.recommendation && (
            <div className="mt-4 flex gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-foreground/80">{campaign.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Performance({
  campaign,
  revenue,
  leads,
  roasVal,
  onOpenPerf,
}: {
  campaign: import("@workspace/api-client-react").Campaign;
  revenue: number;
  leads: number;
  roasVal: number;
  onOpenPerf: () => void;
}) {
  const history = useMemo(
    () =>
      [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((d) => ({
        day: d,
        value: Math.round(campaign.amountSpent * (0.04 + seeded(campaign.id, d + 200) * 0.07)),
      })),
    [campaign.id, campaign.amountSpent],
  );
  const maxHist = Math.max(1, ...history.map((h) => h.value));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <BigStat label="Spend" value={formatCurrency(campaign.amountSpent)} accent />
        <BigStat label="Revenue" value={formatCurrency(revenue)} />
        <BigStat label="ROAS" value={formatRoas(roasVal)} />
        <BigStat label="CPC" value={formatCurrency(cpc(campaign.amountSpent, campaign.clicks))} />
        <BigStat label="CPL" value={formatCurrency(cpl(campaign.amountSpent, leads))} />
        <BigStat label="CPM" value={formatCurrency(campaign.cpm ?? 0)} />
        <BigStat label="CTR" value={`${(campaign.ctr ?? 0).toFixed(2)}%`} />
        <BigStat label="Frequency" value={(campaign.frequency ?? 0).toFixed(2)} />
        <BigStat label="Clicks" value={formatNumber(campaign.clicks)} />
        <BigStat label="Impressions" value={formatNumber(campaign.impressions)} />
        <BigStat label="Reach" value={formatNumber(campaign.reach)} />
        <BigStat label="Results" value={formatNumber(campaign.results)} />
      </div>

      <div className="glass rounded-2xl border border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spend trend (14 days)</span>
          <span className="text-xs text-muted-foreground">Total {formatCurrency(campaign.amountSpent)}</span>
        </div>
        <div className="flex h-40 items-end gap-1.5">
          {history.map((h) => (
            <div key={h.day} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t bg-gradient-to-t from-primary/30 to-primary transition-all hover:from-primary/50"
                style={{ height: `${(h.value / maxHist) * 100}%` }}
                title={formatCurrency(h.value)}
              />
              <span className="text-[9px] text-muted-foreground">{h.day === 0 ? "Now" : `-${h.day}`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div>
          <div className="text-sm font-semibold text-foreground">Adjust spend, revenue and results</div>
          <div className="text-xs text-muted-foreground">Live edits update every page instantly.</div>
        </div>
        <Button size="sm" className="rounded-full" onClick={onOpenPerf}>
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Open controls
        </Button>
      </div>
    </div>
  );
}

function ChangeHistory({ campaign }: { campaign: import("@workspace/api-client-react").Campaign }) {
  const events = useMemo(() => {
    const templates = [
      "Campaign created",
      "Budget updated",
      "Spend recorded",
      "Ad set added",
      "Creative refreshed",
      "Status changed to Active",
      "Optimization goal updated",
      "New ad published",
    ];
    const count = 4 + Math.floor(seeded(campaign.id, 300) * 4);
    return Array.from({ length: count }).map((_, i) => {
      const daysAgo = Math.round(seeded(campaign.id, 301 + i) * 26);
      return {
        text: templates[Math.floor(seeded(campaign.id, 320 + i) * templates.length)],
        actor: ["Jordan Diaz", "Priya Nair", "Liam Chen", "Emma Wolf"][Math.floor(seeded(campaign.id, 340 + i) * 4)],
        daysAgo,
      };
    }).sort((a, b) => a.daysAgo - b.daysAgo);
  }, [campaign.id]);

  return (
    <div className="relative space-y-0 pl-6">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
      {events.map((e, i) => (
        <div key={i} className="relative py-3">
          <div className="absolute -left-[22px] top-4 h-3 w-3 rounded-full border-2 border-primary bg-card" />
          <div className="text-sm font-medium text-foreground">{e.text}</div>
          <div className="text-xs text-muted-foreground">
            {e.actor} · {e.daysAgo === 0 ? "Today" : `${e.daysAgo} day${e.daysAgo > 1 ? "s" : ""} ago`}
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignComments({ campaignId }: { campaignId: number }) {
  const [map, setMap] = useLocalStore<Record<string, AdComment[]>>("campaignComments", {});
  const [text, setText] = useState("");
  const comments = map[String(campaignId)] ?? [];

  const add = () => {
    if (!text.trim()) return;
    const c: AdComment = { id: uid("cc"), author: "You", text: text.trim(), at: new Date().toISOString() };
    setMap((prev) => ({ ...prev, [String(campaignId)]: [...(prev[String(campaignId)] ?? []), c] }));
    setText("");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {comments.length === 0 && (
        <Empty icon={<MessageSquare className="h-6 w-6" />} text="No comments yet. Start the conversation." />
      )}
      {comments.map((c) => (
        <div key={c.id} className="glass rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{c.author}</span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(c.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{c.text}</p>
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Write a comment for the team..."
          className="h-10 rounded-full bg-muted/20"
        />
        <Button className="h-10 w-10 shrink-0 rounded-full p-0" onClick={add}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- */

function BigStat({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: "success" | "warning" | "danger" }) {
  return (
    <div className="glass rounded-xl border border-border px-3.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 truncate font-mono text-lg font-bold",
          accent && "text-primary",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-destructive",
          !accent && !tone && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreCard({ label, score, hint }: { label: string; score: number; hint: string }) {
  const tone = scoreTone(score);
  return (
    <div className="glass rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-mono text-2xl font-bold",
            tone === "success" && "text-success",
            tone === "warning" && "text-warning",
            tone === "danger" && "text-destructive",
          )}
        >
          {score}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "danger" && "bg-destructive",
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 py-16 text-muted-foreground">
      <span className="opacity-50">{icon}</span>
      <span className="text-sm">{text}</span>
    </div>
  );
}
