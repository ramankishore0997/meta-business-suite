import { useQueryClient } from "@tanstack/react-query";
import { useToggleCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { useCampaignsUI } from "./context";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatNumber } from "@/lib/format";
import { roas, resolveExtras, useCampaignExtrasMap, type CampaignExtras } from "@/lib/perf";
import { cn } from "@/lib/utils";
import type { Campaign } from "@workspace/api-client-react";

function Toggle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "relative inline-flex h-[20px] w-[36px] items-center rounded-full transition-colors duration-200",
        checked ? "bg-[#1877f2]" : "bg-[#bcc0c4]"
      )}
    >
      <span
        className={cn(
          "inline-block h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        )}
      />
    </button>
  );
}

function DeliveryDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-[#31a243]",
    learning: "bg-[#f5a623]",
    error: "bg-[#d32f2f]",
    off: "bg-[#bcc0c4]",
    not_delivering: "bg-[#f4511e]",
  };
  return (
    <span className={cn("mr-1.5 inline-block h-[6px] w-[6px] rounded-full", colors[status] || colors.off)} />
  );
}

export function CampaignCard({ campaign, index }: { campaign: Campaign; index: number }) {
  const { isSelected, toggleSelect, openDrawer, activeCampaignId } = useCampaignsUI();
  const selected = isSelected(campaign.id);
  const isActive = activeCampaignId === campaign.id;
  const queryClient = useQueryClient();
  const [extrasMap] = useCampaignExtrasMap();
  const extras: CampaignExtras = resolveExtras(campaign, extrasMap);
  const toggle = useToggleCampaign({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() }) } });
  const budget = campaign.dailyBudget ?? campaign.totalBudget ?? null;
  const isActiveStatus = campaign.status === "ACTIVE";

  const deliveryLabel = campaign.delivery === "active" ? "Active"
    : campaign.delivery === "learning" ? "Learning"
    : campaign.delivery === "error" ? "Error"
    : campaign.delivery === "not_delivering" ? "Learning Limited"
    : "Paused";

  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a, [role="switch"], [role="checkbox"], [role="menuitem"], input')) return;
        openDrawer(campaign.id);
      }}
      className={cn(
        "group cursor-pointer border-b border-[#dadde1] transition-colors",
        isActive ? "bg-[#e7f3ff]" : "hover:bg-[#f0f2f5]"
      )}
    >
      {/* Checkbox */}
      <td className="sticky left-0 z-10 border-r border-[#dadde1] bg-white px-3" style={{ width: 44, minWidth: 44 }} onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={() => toggleSelect(campaign.id)} className="border-[#bcc0c4] rounded-[3px]" />
      </td>

      {/* Off/On Toggle */}
      <td className="sticky left-[44px] z-10 border-r border-[#dadde1] bg-white px-3" style={{ width: 80, minWidth: 80 }} onClick={(e) => e.stopPropagation()}>
        <Toggle checked={isActiveStatus} onToggle={() => toggle.mutate({ id: campaign.id })} />
      </td>

      {/* Campaign Name */}
      <td className="sticky left-[124px] z-10 border-r border-[#dadde1] bg-white px-3 py-2.5" style={{ width: 300, minWidth: 300 }}>
        <div className="truncate text-[13px] font-semibold text-[#0264c9] hover:underline">{campaign.name}</div>
      </td>

      {/* Delivery */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5" style={{ width: 140, minWidth: 140 }}>
        <div className="flex items-center text-[12px] text-[#1c2b33]">
          <DeliveryDot status={campaign.delivery} />
          {deliveryLabel}
        </div>
      </td>

      {/* Actions */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5 text-[12px] text-[#65676b]" style={{ width: 170, minWidth: 170 }}>
        —
      </td>

      {/* Results */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5" style={{ width: 130, minWidth: 130 }}>
        <div className="text-[13px] font-semibold text-[#1c2b33]">
          {campaign.results > 0 ? formatNumber(campaign.results) : "—"}
        </div>
        <div className="text-[11px] text-[#65676b]">
          {campaign.objective === "TRAFFIC" ? "Link clicks" : campaign.objective === "LEADS" ? "Leads" : "Results"}
        </div>
      </td>

      {/* Cost per result */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5" style={{ width: 130, minWidth: 130 }}>
        <div className="text-[13px] font-semibold text-[#1c2b33]">
          {campaign.results > 0 ? formatCurrency(campaign.amountSpent / campaign.results) : "—"}
        </div>
        <div className="text-[11px] text-[#65676b]">
          Per {campaign.objective === "TRAFFIC" ? "link click" : campaign.objective === "LEADS" ? "lead" : "result"}
        </div>
      </td>

      {/* Budget */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5" style={{ width: 120, minWidth: 120 }}>
        {budget ? (
          <>
            <div className="text-[13px] font-semibold text-[#1c2b33]">{formatCurrency(budget)}</div>
            <div className="text-[11px] text-[#65676b]">Daily budget</div>
          </>
        ) : (
          <>
            <div className="text-[13px] text-[#65676b]">Using ad set budget</div>
            <div className="text-[11px] text-[#65676b]">Not shared</div>
          </>
        )}
      </td>

      {/* Amount spent */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5 text-right" style={{ width: 130, minWidth: 130 }}>
        <div className="text-[13px] font-semibold text-[#1c2b33]">{formatCurrency(campaign.amountSpent)}</div>
      </td>

      {/* Impressions */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5 text-right" style={{ width: 130, minWidth: 130 }}>
        <div className="text-[13px] font-semibold text-[#1c2b33]">
          {campaign.impressions > 0 ? formatNumber(campaign.impressions) : "—"}
        </div>
      </td>

      {/* Reach */}
      <td className="border-r border-[#dadde1] bg-white px-3 py-2.5 text-right" style={{ width: 120, minWidth: 120 }}>
        <div className="text-[13px] font-semibold text-[#1c2b33]">
          {campaign.reach > 0 ? formatNumber(campaign.reach) : "—"}
        </div>
      </td>

      {/* Ends */}
      <td className="bg-white px-3 py-2.5 text-[12px] text-[#1c2b33]" style={{ width: 100, minWidth: 100 }}>
        {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Ongoing"}
      </td>
    </tr>
  );
}
