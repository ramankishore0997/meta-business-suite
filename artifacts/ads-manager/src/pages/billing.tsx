import { useMemo } from "react";
import { Layout } from "@/components/layout";
import { PageContainer, PageHeader, GlassCard, StatCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useInvoices, useClients } from "@/lib/store";
import {
  useGetInsightsSummary,
  getGetInsightsSummaryQueryKey,
} from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Link } from "wouter";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Wallet, TrendingUp, Clock, Bitcoin, ArrowUpRight } from "lucide-react";

const statusTone = (s: string) => (s === "paid" ? "success" : s === "overdue" ? "danger" : "warning");

export default function BillingPage() {
  const [invoices] = useInvoices();
  const [clients] = useClients();
  const { data: summary } = useGetInsightsSummary(
    { dateRange: "all" },
    { query: { queryKey: getGetInsightsSummaryQueryKey({ dateRange: "all" }) } }
  );

  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const managedSpend = summary?.totalSpend ?? 0;

  const byClient = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) map.set(inv.client, (map.get(inv.client) ?? 0) + inv.amount);
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.length > 12 ? name.slice(0, 11) + "…" : name, value }));
  }, [invoices]);

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Billing"
          subtitle="Revenue, managed spend and outstanding balances at a glance."
          actions={
            <Link href="/payments">
              <Button variant="outline" className="h-9 gap-2 rounded-xl font-semibold">
                <Bitcoin className="h-4 w-4" /> Crypto Payments
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Revenue" value={formatCurrency(revenue)} delta={9.3} icon={Wallet} accent="#10B981" index={0} />
          <StatCard label="Outstanding" value={formatCurrency(outstanding)} delta={-2.1} icon={Clock} accent="#F59E0B" index={1} />
          <StatCard label="Managed Spend" value={formatCurrency(managedSpend)} delta={12.4} icon={TrendingUp} accent="#3B82F6" index={2} />
          <StatCard label="Active Clients" value={String(clients.filter((c) => c.status === "active").length)} icon={Wallet} accent="#8B5CF6" index={3} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <GlassCard className="p-5 xl:col-span-2">
            <h3 className="mb-4 font-display text-base font-semibold">Billing by Client</h3>
            <div className="h-[280px]">
              {byClient.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No billing data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byClient} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} cursor={{ fill: "hsl(var(--muted)/0.4)" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--popover))" }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Recent Invoices</h3>
              <Link href="/invoices">
                <span className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  All <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
            <div className="space-y-2">
              {invoices.slice(0, 6).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl px-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{inv.client}</p>
                    <p className="text-xs text-muted-foreground">{inv.number} · {formatDate(inv.due)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-sm font-bold">{formatCurrency(inv.amount)}</span>
                    <StatusBadge label={inv.status} tone={statusTone(inv.status)} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </PageContainer>
    </Layout>
  );
}
