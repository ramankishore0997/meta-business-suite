import { Layout } from "@/components/layout";
import {
  useGetInsightsSummary,
  getGetInsightsSummaryQueryKey,
  useGetCampaignInsights,
  getGetCampaignInsightsQueryKey
} from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Target, MousePointerClick, Activity } from "lucide-react";

export default function InsightsPage() {
  const { data: summary, isLoading: isLoadingSummary } = useGetInsightsSummary(
    {},
    { query: { queryKey: getGetInsightsSummaryQueryKey() } }
  );

  const { data: insights = [], isLoading: isLoadingInsights } = useGetCampaignInsights(
    {},
    { query: { queryKey: getGetCampaignInsightsQueryKey() } }
  );

  return (
    <Layout>
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-display font-bold tracking-tight">Performance Overview</h2>
            <p className="text-muted-foreground text-sm">Real-time metrics across all your active campaigns.</p>
          </div>

          {/* Summary Cards */}
          {isLoadingSummary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">Amount Spent</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono tracking-tight text-primary">
                    {formatCurrency(summary.totalSpend)}
                  </div>
                  <p className="text-xs text-primary/70 font-medium mt-2">
                    Across {summary.activeCampaigns} active campaigns
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md bg-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Results</CardTitle>
                  <Target className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono tracking-tight">{formatNumber(summary.totalResults)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {formatCurrency(summary.avgCostPerResult)} avg cost
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Impressions & Reach</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono tracking-tight">{formatNumber(summary.totalImpressions)}</div>
                  <p className="text-xs font-medium text-muted-foreground mt-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {formatNumber(summary.totalReach)} unique reach
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-card hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Efficiency</CardTitle>
                  <MousePointerClick className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-6">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground/70 mb-1">CTR</div>
                      <div className="text-2xl font-bold font-mono tracking-tight">{summary.avgCtr.toFixed(2)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground/70 mb-1">CPM</div>
                      <div className="text-2xl font-bold font-mono tracking-tight">{formatCurrency(summary.avgCpm)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="col-span-1 shadow-sm border-border/50">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Spend vs Results
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] p-6">
                {isLoadingInsights ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" tickFormatter={(value) => `$${value}`} tick={{fontSize: 11, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                      <YAxis dataKey="campaignName" type="category" width={140} interval={0} tickFormatter={(value: string) => value.length > 18 ? `${value.slice(0, 17)}...` : value} tick={{fontSize: 11, fill: 'hsl(var(--foreground))'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-sm border-border/50">
              <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Efficiency Metrics (CPM vs Results)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] p-6">
                {isLoadingInsights ? (
                  <Skeleton className="w-full h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={insights} margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                      <defs>
                        <linearGradient id="colorResults" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="campaignName" tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{fontSize: 11, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `$${value}`} tick={{fontSize: 11, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="results" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorResults)" name="Results" />
                      <Line yAxisId="right" type="monotone" dataKey="cpm" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} name="CPM" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
