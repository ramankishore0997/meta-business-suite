import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCampaigns, getListCampaignsQueryKey, useToggleCampaign, useDeleteCampaign,
  useDuplicateCampaign, getListAdSetsQueryKey, getListAdsQueryKey,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { CampaignsUIProvider, useCampaignsUI } from "@/components/campaigns/context";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignDrawer } from "@/components/campaigns/campaign-drawer";
import { PerformanceControls } from "@/components/campaigns/performance-controls";
import { AdDetailsDrawer } from "@/components/campaigns/ad-details-drawer";
import { CreateDialog } from "@/components/create-dialog";
import { EditDialog, type EditTarget } from "@/components/edit-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Play, Pause, Copy, Trash2, Download, X, Megaphone, PlaySquare } from "lucide-react";
import { resolveExtras, roas, placementsFor, useCampaignExtrasMap, PLACEMENTS } from "@/lib/perf";
import { formatCurrency } from "@/lib/format";
import type { Campaign, Ad } from "@workspace/api-client-react";

const OBJECTIVES = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "APP_PROMOTION", "SALES", "MESSAGES"];

function CampaignsInner() {
  const { data: campaigns = [], isLoading } = useListCampaigns({}, { query: { queryKey: getListCampaignsQueryKey() } });
  const [extrasMap] = useCampaignExtrasMap();
  const ui = useCampaignsUI();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("spend");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [activeTab, setActiveTab] = useState<"campaigns" | "adsets" | "ads">("campaigns");

  const toggle = useToggleCampaign();
  const del = useDeleteCampaign();
  const dup = useDuplicateCampaign();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = Number(localStorage.getItem("campaigns:scroll") || "0");
    if (saved) el.scrollTop = saved;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => localStorage.setItem("campaigns:scroll", String(el.scrollTop)), 150);
    };
    el.addEventListener("scroll", onScroll);
    return () => { clearTimeout(t); el.removeEventListener("scroll", onScroll); };
  }, [isLoading]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") { e.preventDefault(); setCreateOpen(true); }
      if (e.key === "Escape") ui.clearSelect();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui]);

  const filtered = useMemo(() => {
    let list = campaigns.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (objectiveFilter !== "all" && c.objective !== objectiveFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "spend") return b.amountSpent - a.amountSpent;
      if (sortBy === "results") return b.results - a.results;
      if (sortBy === "roas") return roas(resolveExtras(b, extrasMap).revenue, b.amountSpent) - roas(resolveExtras(a, extrasMap).revenue, a.amountSpent);
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
    return list;
  }, [campaigns, search, statusFilter, objectiveFilter, sortBy, extrasMap]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
  };

  const selectedCampaigns = campaigns.filter((c) => ui.selected.includes(c.id));

  const bulk = (action: "activate" | "pause" | "duplicate" | "delete") => {
    const ids = [...ui.selected];
    if (ids.length === 0) return;
    let done = 0;
    const finish = () => {
      done++;
      if (done === ids.length) { invalidateAll(); ui.clearSelect(); toast({ title: `Bulk ${action} complete`, description: `${ids.length} campaign(s) updated` }); }
    };
    ids.forEach((id) => {
      const c = campaigns.find((x) => x.id === id);
      if (action === "delete") del.mutate({ id }, { onSuccess: finish, onError: finish });
      else if (action === "duplicate") dup.mutate({ id }, { onSuccess: finish, onError: finish });
      else { const wantActive = action === "activate"; if (c && (c.status === "ACTIVE") !== wantActive) toggle.mutate({ id }, { onSuccess: finish, onError: finish }); else finish(); }
    });
  };

  const exportSelected = () => {
    const rows = (selectedCampaigns.length ? selectedCampaigns : filtered).map((c) => {
      const ex = resolveExtras(c, extrasMap);
      return { Name: c.name, Objective: c.objective, Status: c.status, Spend: c.amountSpent, Revenue: ex.revenue, ROAS: roas(ex.revenue, c.amountSpent).toFixed(2), Results: c.results, CTR: c.ctr ?? 0, Reach: c.reach, Impressions: c.impressions };
    });
    const headers = Object.keys(rows[0] ?? { Name: "" });
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String((r as Record<string, unknown>)[h] ?? "")}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "campaigns.csv"; a.click(); URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${rows.length} campaign(s)` });
  };

  const allSelected = filtered.length > 0 && filtered.every((c) => ui.selected.includes(c.id));
  const totalSpend = filtered.reduce((s, c) => s + c.amountSpent, 0);
  const hasFilters = search || statusFilter !== "all" || objectiveFilter !== "all";

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Account selector bar */}
      <div className="flex items-center justify-between border-b border-[#e4e6eb] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-[#e4e6eb] bg-white px-3 py-1.5 transition-colors hover:bg-[#f0f2f5]">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#1877f2] text-[10px] font-bold text-white">M</div>
            <span className="text-[13px] font-semibold text-[#1c1e21]">All accounts</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-lg border border-[#e4e6eb] bg-white px-3 py-1.5 text-[12px] text-[#1c1e21]">
            <span className="h-2 w-2 rounded-full bg-[#42b72a]" />
            Opportunity score
          </span>
        </div>
      </div>

      {/* Campaign Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e4e6eb] bg-white px-6 pb-0 pt-2">
        {(["campaigns", "adsets", "ads"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                : "text-[#666] hover:bg-[#f0f2f5]"
            }`}
          >
            {tab === "campaigns" ? "Campaigns" : tab === "adsets" ? "Ad Sets" : "Ads"}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between border-b border-[#e4e6eb] bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          {[
            { label: "All", value: "all", onClick: () => setStatusFilter("all") },
            { label: "Active", value: "ACTIVE", onClick: () => setStatusFilter("ACTIVE") },
            { label: "Paused", value: "PAUSED", onClick: () => setStatusFilter("PAUSED") },
            { label: "Archived", value: "ARCHIVED", onClick: () => setStatusFilter("ARCHIVED") },
          ].map((f) => (
            <button
              key={f.value}
              onClick={f.onClick}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                statusFilter === f.value
                  ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                  : "border-[#e4e6eb] bg-white text-[#1c1e21] hover:bg-[#f0f2f5]"
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-[#e4e6eb]" />
          {OBJECTIVES.map((o) => (
            <button
              key={o}
              onClick={() => setObjectiveFilter(objectiveFilter === o ? "all" : o)}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                objectiveFilter === o
                  ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                  : "border-[#e4e6eb] bg-white text-[#1c1e21] hover:bg-[#f0f2f5]"
              }`}
            >
              {o.charAt(0) + o.slice(1).toLowerCase().replace("_", " ")}
            </button>
          ))}
          {hasFilters && (
            <button onClick={() => { setStatusFilter("all"); setObjectiveFilter("all"); setSearch(""); }} className="flex items-center gap-1 rounded-lg border border-[#e4e6eb] px-2 py-1.5 text-[12px] text-[#666] hover:bg-[#f0f2f5]">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-[#e4e6eb] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1c1e21]">
            <option value="spend">Sort: Top spend</option>
            <option value="roas">Sort: Best ROAS</option>
            <option value="results">Sort: Most results</option>
            <option value="recent">Sort: Newest</option>
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between border-b border-[#e4e6eb] bg-white px-6 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[#e4e6eb] bg-white px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-[#666]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns"
              className="w-[200px] bg-transparent text-[13px] text-[#1c1e21] outline-none placeholder:text-[#999]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg border-[#e4e6eb] bg-white text-[12px] font-semibold text-[#1c1e21] hover:bg-[#f0f2f5]" onClick={exportSelected}>
            <Download className="mr-1 h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="rounded-lg bg-[#1877f2] px-4 text-[12px] font-semibold text-white hover:bg-[#166fe5]" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={3} /> Create
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {ui.selected.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#e4e6eb] bg-[#e7f3ff] px-6 py-2">
          <Checkbox checked={allSelected} onCheckedChange={() => (allSelected ? ui.clearSelect() : ui.selectMany(filtered.map((c) => c.id)))} className="rounded border-[#1877f2]" />
          <span className="text-[13px] font-semibold text-[#1c1e21]">{ui.selected.length} selected</span>
          <div className="mx-1 h-4 w-px bg-[#e4e6eb]" />
          <BulkBtn icon={<Play className="h-3.5 w-3.5" />} label="Activate" onClick={() => bulk("activate")} />
          <BulkBtn icon={<Pause className="h-3.5 w-3.5" />} label="Pause" onClick={() => bulk("pause")} />
          <BulkBtn icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" onClick={() => bulk("duplicate")} />
          <BulkBtn icon={<Download className="h-3.5 w-3.5" />} label="Export" onClick={exportSelected} />
          <BulkBtn icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" danger onClick={() => bulk("delete")} />
          <Button variant="ghost" size="sm" className="ml-auto text-[12px] text-[#666]" onClick={ui.clearSelect}>Clear</Button>
        </div>
      )}

      {/* Results info */}
      <div className="flex items-center gap-2 bg-white px-6 py-2 text-[12px] text-[#666]">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e4e6eb] text-[10px] font-bold italic text-[#666]">i</span>
        Results: {filtered.length} campaign(s) · {formatCurrency(totalSpend)} managed spend
      </div>

      {/* Table */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => (<div key={i} className="h-16 animate-pulse rounded-lg bg-[#f0f2f5]" />))}</div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={!!hasFilters} onCreate={() => setCreateOpen(true)} />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#e4e6eb] bg-[#f7f8fa]">
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#666]">Name</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#666]">Status</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#666]">Delivery</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#666]">Budget</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#666]">Results</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#666]">Cost</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold text-[#666]">ROAS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <CampaignCard key={c.id} campaign={c} index={i} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CampaignDrawer onEditAd={(ad: Ad) => setEditTarget(ad)} />
      <PerformanceControls campaigns={campaigns as Campaign[]} />
      <AdDetailsDrawer />
      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditDialog entity="ad" target={editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />
    </div>
  );
}

function BulkBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors ${
        danger ? "text-[#d32f2f] hover:bg-red-50" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
      }`}
    >
      {icon}{label}
    </button>
  );
}

function EmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
        {hasFilters ? <PlaySquare className="h-7 w-7" /> : <Megaphone className="h-7 w-7" />}
      </span>
      <div>
        <h3 className="text-[16px] font-semibold text-[#1c1e21]">{hasFilters ? "No campaigns match your filters" : "No campaigns yet"}</h3>
        <p className="mt-1 text-[13px] text-[#666]">{hasFilters ? "Try adjusting your search or filters." : "Create your first campaign to start managing spend and results."}</p>
      </div>
      {!hasFilters && (
        <Button className="rounded-lg bg-[#1877f2] px-5 font-semibold text-white hover:bg-[#166fe5]" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={3} /> Create campaign
        </Button>
      )}
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Layout>
      <CampaignsUIProvider>
        <CampaignsInner />
      </CampaignsUIProvider>
    </Layout>
  );
}
