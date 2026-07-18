import { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { PageContainer, PageHeader, GlassCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGetCampaignInsights,
  getGetCampaignInsightsQueryKey,
} from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30d");
  const [sortBy, setSortBy] = useState<"spend" | "results" | "ctr">("spend");

  const { data: insights = [] } = useGetCampaignInsights(
    { dateRange },
    { query: { queryKey: getGetCampaignInsightsQueryKey({ dateRange }) } }
  );

  const rows = useMemo(() => {
    return [...insights].sort((a, b) => {
      if (sortBy === "spend") return (b.spend ?? 0) - (a.spend ?? 0);
      if (sortBy === "results") return (b.results ?? 0) - (a.results ?? 0);
      return (b.ctr ?? 0) - (a.ctr ?? 0);
    });
  }, [insights, sortBy]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        spend: acc.spend + (r.spend ?? 0),
        results: acc.results + (r.results ?? 0),
        impressions: acc.impressions + (r.impressions ?? 0),
        clicks: acc.clicks + (r.clicks ?? 0),
      }),
      { spend: 0, results: 0, impressions: 0, clicks: 0 }
    );
  }, [rows]);

  function exportCsv() {
    const header = ["Campaign", "Spend", "Results", "Impressions", "Clicks", "CTR", "CPM", "Cost/Result"];
    const lines = rows.map((r) =>
      [
        `"${r.campaignName}"`,
        (r.spend ?? 0).toFixed(2),
        r.results ?? 0,
        r.impressions ?? 0,
        r.clicks ?? 0,
        (r.ctr ?? 0).toFixed(2),
        (r.cpm ?? 0).toFixed(2),
        (r.results ? (r.spend ?? 0) / r.results : 0).toFixed(2),
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported", description: `${rows.length} campaigns downloaded as CSV.` });
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Reports"
          subtitle="Build and export performance reports for any period."
          actions={
            <Button onClick={exportCsv} className="h-9 gap-2 rounded-xl font-semibold shadow-lg shadow-primary/25" disabled={rows.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          }
        />

        <GlassCard className="mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Report filters</span>
          </div>
          <div className="flex flex-1 flex-wrap gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="spend">Sort by Spend</SelectItem>
                <SelectItem value="results">Sort by Results</SelectItem>
                <SelectItem value="ctr">Sort by CTR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCard>

        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Spend</p>
            <p className="mt-2 font-display text-xl font-bold text-primary">{formatCurrency(totals.spend)}</p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Results</p>
            <p className="mt-2 font-display text-xl font-bold text-success">{formatNumber(totals.results)}</p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Impressions</p>
            <p className="mt-2 font-display text-xl font-bold">{formatNumber(totals.impressions)}</p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Clicks</p>
            <p className="mt-2 font-display text-xl font-bold">{formatNumber(totals.clicks)}</p>
          </GlassCard>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 text-left font-semibold">Campaign</th>
                  <th className="px-5 py-3 text-right font-semibold">Spend</th>
                  <th className="px-5 py-3 text-right font-semibold">Results</th>
                  <th className="px-5 py-3 text-right font-semibold">Impressions</th>
                  <th className="px-5 py-3 text-right font-semibold">CTR</th>
                  <th className="px-5 py-3 text-right font-semibold">CPM</th>
                  <th className="px-5 py-3 text-right font-semibold">Cost/Result</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">No data for this period.</td></tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.campaignId} className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium">{r.campaignName}</td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-primary">{formatCurrency(r.spend)}</td>
                      <td className="px-5 py-3 text-right font-mono">{formatNumber(r.results)}</td>
                      <td className="px-5 py-3 text-right font-mono">{formatNumber(r.impressions)}</td>
                      <td className="px-5 py-3 text-right font-mono">{(r.ctr ?? 0).toFixed(2)}%</td>
                      <td className="px-5 py-3 text-right font-mono">{formatCurrency(r.cpm)}</td>
                      <td className="px-5 py-3 text-right font-mono">{formatCurrency(r.results ? (r.spend ?? 0) / r.results : 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </PageContainer>
    </Layout>
  );
}
