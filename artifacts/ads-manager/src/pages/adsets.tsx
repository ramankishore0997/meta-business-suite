import { Layout } from "@/components/layout";
import { Toolbar } from "@/components/toolbar";
import {
  useListAdSets,
  getListAdSetsQueryKey,
  useToggleAdSet,
  useListCampaigns,
  getListCampaignsQueryKey,
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
import { formatCurrency, formatNumber, formatDate } from "@/lib/format";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useSearch } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EditDialog, type EditTarget } from "@/components/edit-dialog";
import { EntityActions } from "@/components/entity-actions";

export default function AdSetsPage() {
  const { data: adsets = [], isLoading } = useListAdSets(
    {},
    { query: { queryKey: getListAdSetsQueryKey() } }
  );
  const { data: campaigns = [] } = useListCampaigns(
    {},
    { query: { queryKey: getListCampaignsQueryKey() } }
  );

  const search = useSearch();
  const campaignId = new URLSearchParams(search).get("campaignId");
  const cid = campaignId ? Number(campaignId) : null;
  const campaignName = cid
    ? campaigns.find((c) => c.id === cid)?.name
    : undefined;
  const filtered = cid ? adsets.filter((a) => a.campaignId === cid) : adsets;

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const queryClient = useQueryClient();
  const toggleMutation = useToggleAdSet({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey() });
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
            { label: campaignName ?? "Ad Sets" },
          ]}
        />

        <div className="flex-1 overflow-auto bg-card">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted/50 rounded-md animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="min-w-[1300px]">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-[0_1px_0_hsl(var(--border))] backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-[40px] px-4">
                      <Checkbox className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    </TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[200px]">Ad Set Name</TableHead>
                    <TableHead className="min-w-[180px]">Campaign</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead className="text-right">Results</TableHead>
                    <TableHead className="text-right">Cost per Result</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Amount Spent</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">Reach</TableHead>
                    <TableHead>Ends</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="h-48 text-center text-muted-foreground">
                        No ad sets found in this view.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((adset, i) => (
                      <TableRow 
                        key={adset.id} 
                        className="group hover:bg-primary/5 transition-colors border-border/50 animate-in slide-in-from-bottom-2 fade-in fill-mode-both"
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <TableCell className="px-4">
                          <Checkbox className="rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity" />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={adset.status === "ACTIVE"}
                            onCheckedChange={() => toggleMutation.mutate({ id: adset.id })}
                            className="scale-90"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Link href={`/ads?adsetId=${adset.id}`}>
                                <span className="text-foreground font-semibold hover:text-primary transition-colors cursor-pointer tracking-tight">
                                  {adset.name}
                                </span>
                              </Link>
                            </div>
                            {adset.recommendation && (
                              <Badge variant="outline" className="w-fit mt-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider rounded-sm">
                                Rec
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                           <Link href={`/adsets?campaignId=${adset.campaignId}`}>
                            <span className="text-muted-foreground text-xs hover:text-foreground transition-colors cursor-pointer">{adset.campaignName}</span>
                           </Link>
                        </TableCell>
                        <TableCell>
                          <DeliveryPill status={adset.delivery} />
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground tracking-tight">
                          {formatNumber(adset.results)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatCurrency(adset.costPerResult)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground font-mono text-xs">
                          {formatCurrency(adset.budget)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium">
                          {formatCurrency(adset.amountSpent)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatNumber(adset.impressions)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {formatNumber(adset.reach)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-medium">
                          {adset.endDate ? formatDate(adset.endDate) : "Ongoing"}
                        </TableCell>
                        <TableCell className="pr-4">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <EntityActions
                              type="adset"
                              id={adset.id}
                              name={adset.name}
                              onEdit={() => setEditTarget(adset)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  
                  {/* Totals Row */}
                  {filtered.length > 0 && (
                    <TableRow className="bg-muted/20 hover:bg-muted/20 border-t-2 border-border/60">
                      <TableCell colSpan={5} className="text-right pr-8 font-medium text-foreground/80 uppercase tracking-wider text-xs">
                        Results from {filtered.length} ad sets
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-foreground">{formatNumber(totals.results)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold mt-0.5">Total</div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground font-normal">
                        -
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
        entity="adset"
        target={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      />
    </Layout>
  );
}
