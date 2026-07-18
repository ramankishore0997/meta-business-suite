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
        "relative inline-flex h-[18px] w-[32px] items-center rounded-full transition-colors duration-200",
        checked ? "bg-[#1877f2]" : "bg-[#bcc0c4]"
      )}
    >
      <span
        className={cn(
          "inline-block h-[14px] w-[14px] rounded-full bg-white transition-transform duration-200",
          checked ? "translate-x-[16px]" : "translate-x-[2px]"
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
    <span className={cn("mr-1 inline-block h-[5px] w-[5px] rounded-full", colors[status] || colors.off)} />
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
        isActive ? "bg-[#e7f3ff]" : "hover:bg-[#f7f8fa]"
      )}
      style={{ height: 40 }}
    >
      {/* Checkbox */}
      <td className="sticky left-0 z-10 border-r border-[#dadde1] bg-white px-2" style={{ width: 40, minWidth: 40 }} onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={() => toggleSelect(campaign.id)} className="border-[#bcc0c4] rounded-[3px] h-3.5 w-3.5" />
      </td>

      {/* Off/On Toggle */}
      <td className="sticky left-[40px] z-10 border-r border-[#dadde1] bg-white px-2" style={{ width: 64, minWidth: 64 }} onClick={(e) => e.stopPropagation()}>
        <Toggle checked={isActiveStatus} onToggle={() => toggle.mutate({ id: campaign.id })} />
      </td>

      {/* Campaign Name */}
      <td className="sticky left-[104px] z-10 border-r border-[#dadde1] bg-white px-2" style={{ width: 280, minWidth: 280 }}>
        <div className="truncate text-[13px] font-medium text-[#0264c9] hover:underline">{campaign.name}</div>
      </td>

      {/* Delivery */}
      <td className="border-r border-[#dadde1] bg-white px-2" style={{ width: 130, minWidth: 130 }}>
        <div className="flex items-center text-[12px] text-[#1c2b33]">
          <DeliveryDot status={campaign.delivery} />
          {deliveryLabel}
        </div>
      </td>

      {/* Actions */}
      <td className="border-r border-[#dadde1] bg-white px-2 text-[12px] text-[#65676b]" style={{ width: 120, minWidth: 120 }}>
        —
      </td>

      {/* Results */}
      <td className="border-r border-[#dadde1] bg-white px-2" style={{ width: 120, minWidth: 120 }}>
        <div className="text-[13px] text-[#1c2b33]">
          {campaign.results > 0 ? formatNumber(campaign.results) : "—"}
        </div>
        <div className="text-[10px] leading-tight text-[#65676b]">
          {campaign.objective === "TRAFFIC" ? "Link clicks" : campaign.objective === "LEADS" ? "Leads" : "Results"}
        </div>
      </td>

      {/* Cost per result */}
      <td className="border-r border-[#dadde1] bg-white px-2" style={{ width: 120, minWidth: 120 }}>
        <div className="text-[13px] text-[#1c2b33]">
          {campaign.results > 0 ? formatCurrency(campaign.amountSpent / campaign.results) : "—"}
        </div>
        <div className="text-[10px] leading-tight text-[#65676b]">
          Per {campaign.objective === "TRAFFIC" ? "link click" : campaign.objective === "LEADS" ? "lead" : "result"}
        </div>
      </td>

      {/* Budget */}
      <td className="border-r border-[#dadde1] bg-white px-2" style={{ width: 110, minWidth: 110 }}>
        {budget ? (
          <>
            <div className="text-[13px] text-[#1c2b33]">{formatCurrency(budget)}</div>
            <div className="text-[10px] leading-tight text-[#65676b]">Daily budget</div>
          </>
        ) : (
          <>
            <div className="text-[12px] text-[#65676b]">Using ad set budget</div>
          </>
        )}
      </td>

      {/* Amount spent */}
      <td className="border-r border-[#dadde1] bg-white px-2 text-right" style={{ width: 110, minWidth: 110 }}>
        <div className="text-[13px] text-[#1c2b33]">{formatCurrency(campaign.amountSpent)}</div>
      </td>

      {/* Impressions */}
      <td className="border-r border-[#dadde1] bg-white px-2 text-right" style={{ width: 110, minWidth: 110 }}>
        <div className="text-[13px] text-[#1c2b33]">
          {campaign.impressions > 0 ? formatNumber(campaign.impressions) : "—"}
        </div>
      </td>

      {/* Reach */}
      <td className="border-r border-[#dadde1] bg-white px-2 text-right" style={{ width: 100, minWidth: 100 }}>
        <div className="text-[13px] text-[#1c2b33]">
          {campaign.reach > 0 ? formatNumber(campaign.reach) : "—"}
        </div>
      </td>

      {/* Ends */}
      <td className="bg-white px-2 text-[12px] text-[#1c2b33]" style={{ width: 90, minWidth: 90 }}>
        {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Ongoing"}
      </td>
    </tr>
  );
}
