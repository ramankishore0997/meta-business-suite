import { useQueryClient } from "@tanstack/react-query";
import {
  useListAds,
  getListAdsQueryKey,
  useToggleAdSet,
  getListAdSetsQueryKey,
} from "@workspace/api-client-react";
import { AdCard } from "./ad-card";
import { useCampaignsUI } from "./context";
import { DeliveryPill } from "@/components/delivery-pill";
import { EntityActions } from "@/components/entity-actions";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  ageDistribution,
  genderDistribution,
  deviceDistribution,
  placementDistribution,
  countryDistribution,
  estimatedAudience,
  compact,
  type DistItem,
} from "@/lib/perf";
import { cn } from "@/lib/utils";
import { ChevronRight, Users, Layers, Plus } from "lucide-react";
import type { AdSet, Ad } from "@workspace/api-client-react";

export function AdSetBlock({ adset, onEditAd }: { adset: AdSet; onEditAd: (ad: Ad) => void }) {
  const { isAdsetExpanded, toggleAdset } = useCampaignsUI();
  const expanded = isAdsetExpanded(adset.id);
  const queryClient = useQueryClient();

  const { data: allAds = [] } = useListAds({}, { query: { queryKey: getListAdsQueryKey(), enabled: expanded } });
  const ads = allAds.filter((a) => a.adsetId === adset.id);

  const toggle = useToggleAdSet({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey() }) },
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/40">
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, a, [role="switch"], [role="menuitem"]')) return;
          toggleAdset(adset.id);
        }}
        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
      >
        <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold tracking-tight text-foreground">{adset.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {adset.location || "Worldwide"} · {adset.gender && adset.gender !== "all" ? adset.gender : "All genders"} · {adset.ageMin ?? 18}-{adset.ageMax ?? 65}
          </div>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <MiniStat label="Spend" value={formatCurrency(adset.amountSpent)} accent />
          <MiniStat label="Results" value={formatNumber(adset.results)} />
          <MiniStat label="CTR" value={`${(adset.ctr ?? 0).toFixed(1)}%`} />
        </div>

        <DeliveryPill status={adset.delivery} />

        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Switch checked={adset.status === "ACTIVE"} onCheckedChange={() => toggle.mutate({ id: adset.id })} className="scale-75" />
          <EntityActions type="adset" id={adset.id} name={adset.name} onEdit={() => { /* edit handled via drill page */ }} />
        </div>
      </div>

      {expanded && (
        <div className="space-y-5 border-t border-border/60 bg-muted/10 px-4 py-4 duration-200 animate-in fade-in slide-in-from-top-2">
          <AudienceInsights adset={adset} />

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ads ({ads.length})
              </span>
            </div>
            {ads.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background/40 py-8 text-muted-foreground">
                <Plus className="h-5 w-5 opacity-50" />
                <span className="text-xs">No ads in this ad set yet.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ads.map((ad) => (
                  <AdCard key={ad.id} ad={ad} onEdit={onEditAd} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AudienceInsights({ adset }: { adset: AdSet }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Audience insights
        </span>
        <span className="text-xs text-muted-foreground">
          Est. reach <span className="font-mono font-bold text-foreground">{compact(estimatedAudience(adset.id))}</span>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DistBlock title="Age" items={ageDistribution(adset.id)} />
        <DistBlock title="Gender" items={genderDistribution(adset.id)} />
        <DistBlock title="Device" items={deviceDistribution(adset.id)} />
        <DistBlock title="Placement" items={placementDistribution(adset.id)} />
        <DistBlock title="Top countries" items={countryDistribution(adset.id)} />
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Targeting</div>
          {adset.detailedTargeting || adset.audience ? (
            <p className="text-xs leading-relaxed text-foreground/80">{adset.detailedTargeting || adset.audience}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Broad targeting</p>
          )}
          {adset.optimization && (
            <p className="text-[11px] text-muted-foreground">Optimizing for {adset.optimization}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DistBlock({ title, items }: { title: string; items: DistItem[] }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <span className="w-20 shrink-0 truncate text-[11px] text-muted-foreground">{it.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${it.value}%` }} />
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-[10px] font-semibold text-foreground">{it.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("font-mono text-xs font-bold", accent ? "text-primary" : "text-foreground")}>{value}</div>
    </div>
  );
}
