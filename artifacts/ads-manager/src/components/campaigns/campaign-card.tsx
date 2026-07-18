import { useQueryClient } from "@tanstack/react-query";
import { useToggleCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useCampaignsUI } from "./context";
import { ObjectiveBadge } from "./objectives";
import { DeliveryPill } from "@/components/delivery-pill";
import { EntityActions } from "@/components/entity-actions";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
  useCampaignExtrasMap,
  type CampaignExtras,
} from "@/lib/perf";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, Maximize2 } from "lucide-react";
import type { Campaign } from "@workspace/api-client-react";

export function CampaignCard({ campaign, index }: { campaign: Campaign; index: number }) {
  const { isSelected, toggleSelect, openPerf, openDrawer, activeCampaignId } = useCampaignsUI();
  const selected = isSelected(campaign.id);
  const isActive = activeCampaignId === campaign.id;
  const queryClient = useQueryClient();

  const [extrasMap] = useCampaignExtrasMap();
  const extras: CampaignExtras = resolveExtras(campaign, extrasMap);

  const toggle = useToggleCampaign({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }) },
  });

  const roasVal = roas(extras.revenue, campaign.amountSpent);
  const health = healthScore(campaign);
  const perf = performanceScore(roasVal, campaign.ctr);
  const placements = placementsFor(campaign.id);
  const budget = campaign.dailyBudget ?? campaign.totalBudget ?? null;

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a, [role="switch"], [role="checkbox"], [role="menuitem"]')) return;
        openDrawer(campaign.id);
      }}
      className={cn(
        "group glass hover-glow cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 fill-mode-both",
        isActive ? "border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]" : "border-border hover:border-primary/40",
      )}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            onCheckedChange={() => toggleSelect(campaign.id)}
            className="rounded-[5px] border-muted-foreground/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {campaign.name}
            </h3>
            <ObjectiveBadge objective={campaign.objective} />
            {campaign.abTestEnabled && (
              <span className="rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                A/B
              </span>
            )}
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {placements.map((p) => (
              <span key={p.key} className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
            ))}
            {extras.tags.map((t) => (
              <span key={t} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>Manager <span className="font-medium text-foreground/80">{extras.manager}</span></span>
            <span>Created {formatDate(campaign.createdAt)}</span>
            <span>{budget != null ? `Budget ${formatCurrency(budget)}${campaign.dailyBudget != null ? "/day" : ""}` : "No budget cap"}</span>
            <span>{campaign.endDate ? `Ends ${formatDate(campaign.endDate)}` : "Ongoing"}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <ScorePill label="Health" score={health} />
            <ScorePill label="Perf" score={perf} />
          </div>
          <DeliveryPill status={campaign.delivery} />
          <Switch checked={campaign.status === "ACTIVE"} onCheckedChange={() => toggle.mutate({ id: campaign.id })} />
          <Button
            variant="outline"
            size="sm"
            className={cn("rounded-full", isActive && "border-primary text-primary")}
            onClick={() => openPerf(campaign.id)}
            title="Open Performance Controls"
          >
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
            Controls
          </Button>
          <EntityActions type="campaign" id={campaign.id} name={campaign.name} onEdit={() => openDrawer(campaign.id)} />
        </div>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/40 sm:grid-cols-4 lg:grid-cols-8">
        <Metric label="Spend" value={formatCurrency(campaign.amountSpent)} accent />
        <Metric label="Revenue" value={formatCurrency(extras.revenue)} />
        <Metric label="ROAS" value={formatRoas(roasVal)} tone={scoreTone(roasVal >= 2 ? 80 : roasVal >= 1 ? 55 : 30)} />
        <Metric label="Results" value={formatNumber(campaign.results)} />
        <Metric label="Cost / Result" value={formatCurrency(campaign.costPerResult)} />
        <Metric label="CPL" value={formatCurrency(cpl(campaign.amountSpent, extras.leads))} />
        <Metric label="CTR" value={`${(campaign.ctr ?? 0).toFixed(2)}%`} />
        <Metric label="Reach" value={formatNumber(campaign.reach)} />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "success" | "warning" | "danger";
}) {
  return (
    <div className="bg-card px-3 py-2.5">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 truncate font-mono text-sm font-bold",
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

function ScorePill({ label, score }: { label: string; score: number }) {
  const tone = scoreTone(score);
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2 py-1",
        tone === "success" && "border-success/25 bg-success/10",
        tone === "warning" && "border-warning/25 bg-warning/10",
        tone === "danger" && "border-destructive/25 bg-destructive/10",
      )}
      title={`${label} score`}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-xs font-bold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-destructive",
        )}
      >
        {score}
      </span>
    </div>
  );
}
