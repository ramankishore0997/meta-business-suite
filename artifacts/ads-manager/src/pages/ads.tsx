import { Layout } from "@/components/layout";
import { Toolbar } from "@/components/toolbar";
import {
  useListAds,
  getListAdsQueryKey,
  useToggleAd,
  useListAdSets,
  getListAdSetsQueryKey,
} from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { DeliveryPill } from "@/components/delivery-pill";
import { formatCurrency, formatNumber, mediaSrc } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useSearch, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { EditDialog, type EditTarget } from "@/components/edit-dialog";
import { EntityActions } from "@/components/entity-actions";

export default function AdsPage() {
  const { data: ads = [], isLoading } = useListAds(
    {},
    { query: { queryKey: getListAdsQueryKey() } }
  );
  const { data: adsetsList = [] } = useListAdSets(
    {},
    { query: { queryKey: getListAdSetsQueryKey() } }
  );

  const search = useSearch();
  const adsetId = new URLSearchParams(search).get("adsetId");
  const aid = adsetId ? Number(adsetId) : null;
  const adset = aid ? adsetsList.find((a) => a.id === aid) : undefined;
  const filtered = aid ? ads.filter((a) => a.adsetId === aid) : ads;

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const queryClient = useQueryClient();
  const toggleMutation = useToggleAd({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
      },
    },
  });

  const totals = filtered.reduce(
    (acc, a) => ({
      amountSpent: acc.amountSpent + a.amountSpent,
      impressions: acc.impressions + a.impressions,
      reach: acc.reach + a.reach,
      results: acc.results + a.results,
    }),
    { amountSpent: 0, impressions: 0, reach: 0, results: 0 }
  );

  return (
    <Layout>
      <div className="flex flex-col h-full bg-card m-4 md:m-6 lg:m-8 border border-border shadow-sm rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <Toolbar
          breadcrumb={[
            { label: "Campaigns", href: "/campaigns" },
            {
              label: adset?.campaignName ?? "Campaign",
              href: adset ? `/adsets?campaignId=${adset.campaignId}` : "/campaigns",
            },
            { label: adset?.name ?? "Ads" },
          ]}
        />

        <div className="flex-1 overflow-auto bg-card">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="min-w-[1400px]">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-[0_1px_0_hsl(var(--border))] backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-[40px] px-4">
                      <Checkbox className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[250px]">Ad Name</TableHead>
                    <TableHead className="min-w-[150px]">Ad Set</TableHead>
                    <TableHead className="min-w-[150px]">Campaign</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead className="text-right">Results</TableHead>
                    <TableHead className="text-right">Cost per Result</TableHead>
                    <TableHead className="text-right">Amount Spent</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-48 text-center text-muted-foreground">
                        No ads found in this view.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((ad, i) => (
                      <TableRow 
                        key={ad.id} 
                        className="group hover:bg-primary/5 transition-colors border-border/50 animate-in slide-in-from-bottom-2 fade-in fill-mode-both"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <TableCell className="px-4">
                          <Checkbox className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity" />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={ad.status === "ACTIVE"}
                            onCheckedChange={() => toggleMutation.mutate({ id: ad.id })}
                            className="scale-90"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            {mediaSrc(ad.mediaUrl) ? (
                              <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden border border-border bg-muted/30 shadow-sm relative group-hover:shadow-md transition-shadow">
                                <img
                                  src={mediaSrc(ad.mediaUrl)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border border-dashed bg-muted/10 text-muted-foreground/50">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground font-semibold truncate tracking-tight">
                                  {ad.name}
                                </span>
                              </div>
                              {ad.recommendation && (
                                <Badge variant="outline" className="w-fit mt-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider rounded-sm">
                                  Rec
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                           <Link href={`/ads?adsetId=${ad.adsetId}`}>
                            <span className="text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer truncate block">{ad.adsetName}</span>
                           </Link>
                        </TableCell>
                        <TableCell>
                           <Link href={`/adsets?campaignId=${ad.campaignId}`}>
                            <span className="text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer truncate block">{ad.campaignName}</span>
                           </Link>
                        </TableCell>
                        <TableCell>
                          <DeliveryPill status={ad.delivery} />
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground tracking-tight">
                          {formatNumber(ad.results)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatCurrency(ad.costPerResult)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          {formatCurrency(ad.amountSpent)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatNumber(ad.impressions)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatNumber(ad.reach)}
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <EntityActions
                              type="ad"
                              id={ad.id}
                              name={ad.name}
                              onEdit={() => setEditTarget(ad)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  
                  {/* Totals Row */}
                  {filtered.length > 0 && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-t-2 border-border/60">
                      <TableCell colSpan={6} className="text-right pr-8 font-medium text-foreground/80 uppercase tracking-wider text-xs">
                        Results from {filtered.length} ads
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-foreground">{formatNumber(totals.results)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mt-0.5">Total</div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-normal">
                        -
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-foreground font-mono text-sm">{formatCurrency(totals.amountSpent)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mt-0.5">Total</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-foreground font-mono text-sm">{formatNumber(totals.impressions)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mt-0.5">Total</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-foreground font-mono text-sm">{formatNumber(totals.reach)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mt-0.5">Total</div>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      <EditDialog
        entity="ad"
        target={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />
    </Layout>
  );
}
