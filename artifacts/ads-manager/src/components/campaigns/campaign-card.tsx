import { useQueryClient } from "@tanstack/react-query";
import { useToggleCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useCampaignsUI } from "./context";
import { ObjectiveBadge } from "./objectives";
import { DeliveryPill } from "@/components/delivery-pill";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cpc, roas, cpl, healthScore, placementsFor, resolveExtras, useCampaignExtrasMap, type CampaignExtras } from "@/lib/perf";
import { cn } from "@/lib/utils";
import { Maximize2 } from "lucide-react";
import type { Campaign } from "@workspace/api-client-react";

export function CampaignCard({ campaign, index }: { campaign: Campaign; index: number }) {
  const { isSelected, toggleSelect, openDrawer, activeCampaignId } = useCampaignsUI();
  const selected = isSelected(campaign.id);
  const isActive = activeCampaignId === campaign.id;
  const queryClient = useQueryClient();
  const [extrasMap] = useCampaignExtrasMap();
  const extras: CampaignExtras = resolveExtras(campaign, extrasMap);
  const toggle = useToggleCampaign({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }) } });
  const roasVal = roas(extras.revenue, campaign.amountSpent);
  const health = healthScore(campaign);
  const placements = placementsFor(campaign.id);
  const budget = campaign.dailyBudget ?? campaign.totalBudget ?? null;
  const isActiveStatus = campaign.status === "ACTIVE";

  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a, [role="switch"], [role="checkbox"], [role="menuitem"]')) return;
        openDrawer(campaign.id);
      }}
      className={cn(
        "cursor-pointer border-b border-[#e4e6eb] transition-colors",
        isActive ? "bg-[#e7f3ff]" : "hover:bg-[#f0f2f5]"
      )}
    >
      {/* Checkbox + Name */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <Checkbox checked={selected} onCheckedChange={() => toggleSelect(campaign.id)} className="rounded border-[#ccc]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[13px] font-semibold text-[#1c1e21]">{campaign.name}</span>
              {campaign.abTestEnabled && <span className="rounded bg-[#fff8e1] px-1.5 py-0.5 text-[10px] font-bold text-[#f57f17]">A/B</span>}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-[#666]">
              <ObjectiveBadge objective={campaign.objective} />
              {placements.slice(0, 2).map((p) => (
                <span key={p.key} className="flex items-center gap-1 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </td>

      {/* Status Toggle */}
      <td className="px-4 py-4">
        <button
          onClick={(e) => { e.stopPropagation(); toggle.mutate({ id: campaign.id }); }}
          className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", isActiveStatus ? "bg-[#42b72a]" : "bg-[#e4e6eb]")}
        >
          <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", isActiveStatus ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </td>

      {/* Delivery */}
      <td className="px-4 py-4">
        <DeliveryPill status={campaign.delivery} />
      </td>

      {/* Budget */}
      <td className="px-4 py-4 text-right">
        {budget ? (
          <span className="text-[13px] font-medium text-[#1c1e21]">{formatCurrency(budget)}</span>
        ) : (
          <span className="text-[13px] text-[#999]">—</span>
        )}
      </td>

      {/* Results */}
      <td className="px-4 py-4 text-right">
        <span className="text-[13px] font-medium text-[#1c1e21]">{formatNumber(campaign.results)}</span>
      </td>

      {/* Cost */}
      <td className="px-4 py-4 text-right">
        <span className="text-[13px] text-[#1c1e21]">{campaign.results > 0 ? formatCurrency(campaign.amountSpent / campaign.results) : "—"}</span>
      </td>

      {/* ROAS */}
      <td className="px-4 py-4 text-right">
        <span className={cn("text-[13px] font-semibold", roasVal >= 2 ? "text-[#2e7d32]" : roasVal >= 1 ? "text-[#1c1e21]" : "text-[#d32f2f]")}>
          {roasVal.toFixed(2)}x
        </span>
      </td>

      {/* Expand */}
      <td className="px-4 py-4">
        <Maximize2 className="h-3.5 w-3.5 text-[#ccc] opacity-0 transition-opacity group-hover:opacity-100" />
      </td>
    </tr>
  );
}
