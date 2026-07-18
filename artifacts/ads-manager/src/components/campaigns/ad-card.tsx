import { useQueryClient } from "@tanstack/react-query";
import { useToggleAd, getListAdsQueryKey } from "@workspace/api-client-react";
import { CreativePreview } from "./creative-preview";
import { useCampaignsUI } from "./context";
import { DeliveryPill } from "@/components/delivery-pill";
import { EntityActions } from "@/components/entity-actions";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cpc, adSocial, compact } from "@/lib/perf";
import { cn } from "@/lib/utils";
import { ThumbsUp, MessageCircle, Share2, Target } from "lucide-react";
import type { Ad } from "@workspace/api-client-react";

export function AdCard({ ad, onEdit }: { ad: Ad; onEdit: (ad: Ad) => void }) {
  const { openAd } = useCampaignsUI();
  const queryClient = useQueryClient();
  const toggle = useToggleAd({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() }) },
  });

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a, [role="switch"], [role="menuitem"]')) return;
        openAd(ad);
      }}
      className="group glass hover-glow relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border transition-all"
    >
      <CreativePreview url={ad.mediaUrl} format={ad.format} className="aspect-[16/10] w-full" showFullscreenButton />

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-foreground">{ad.name}</div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{ad.format}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={ad.status === "ACTIVE"}
              onCheckedChange={() => toggle.mutate({ id: ad.id })}
              className="scale-75"
            />
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              <EntityActions type="ad" id={ad.id} name={ad.name} onEdit={() => onEdit(ad)} />
            </div>
          </div>
        </div>

        <DeliveryPill status={ad.delivery} />

        <div className="mt-1 grid grid-cols-4 gap-1.5 border-t border-border/60 pt-2.5">
          <Metric label="Spend" value={formatCurrency(ad.amountSpent)} accent />
          <Metric label="Results" value={formatNumber(ad.results)} />
          <Metric label="CTR" value={`${(ad.ctr ?? 0).toFixed(1)}%`} />
          <Metric label="CPC" value={formatCurrency(cpc(ad.amountSpent, ad.clicks))} />
        </div>

        <Social ad={ad} />
      </div>
    </div>
  );
}

function Social({ ad }: { ad: Ad }) {
  const s = adSocial(ad);
  return (
    <div className="flex items-center justify-between border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
      <SocialItem icon={<ThumbsUp className="h-3 w-3" />} value={compact(s.likes)} title="Likes" />
      <SocialItem icon={<MessageCircle className="h-3 w-3" />} value={compact(s.comments)} title="Comments" />
      <SocialItem icon={<Share2 className="h-3 w-3" />} value={compact(s.shares)} title="Shares" />
      <SocialItem icon={<Target className="h-3 w-3 text-success" />} value={compact(s.conversions)} title="Conversions" />
    </div>
  );
}

function SocialItem({ icon, value, title }: { icon: React.ReactNode; value: string; title: string }) {
  return (
    <span className="flex items-center gap-1" title={title}>
      {icon}
      <span className="font-medium text-foreground/80">{value}</span>
    </span>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("truncate font-mono text-[11px] font-bold", accent ? "text-primary" : "text-foreground")}>{value}</div>
    </div>
  );
}
