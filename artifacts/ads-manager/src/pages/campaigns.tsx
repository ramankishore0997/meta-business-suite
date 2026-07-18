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
import {
  Plus, Copy, Trash2, Download, X, Megaphone, PlaySquare,
  ChevronDown, Columns3, BarChart3, Settings2, MoreHorizontal, Info, FileDown,
} from "lucide-react";
import { resolveExtras, roas, useCampaignExtrasMap } from "@/lib/perf";
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
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showBreakdownMenu, setShowBreakdownMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
      if (e.key === "Escape") {
        ui.clearSelect();
        setShowColumnsMenu(false);
        setShowBreakdownMenu(false);
        setShowMoreMenu(false);
      }
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
      <div className="flex items-center justify-between border-b border-[#dadde1] bg-white px-6 py-2.5">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-[#dadde1] bg-white px-3 py-1.5 transition-colors hover:bg-[#f0f2f5]">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1877f2] text-[9px] font-bold text-white">M</div>
            <span className="text-[12px] font-semibold text-[#1c1e21]">All accounts</span>
            <ChevronDown className="h-3 w-3 text-[#666]" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border border-[#dadde1] bg-white px-3 py-1.5 text-[11px] text-[#1c1e21]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#42b72a]" />
            Opportunity score
          </span>
        </div>
      </div>

      {/* Campaign Tabs */}
      <div className="flex items-center gap-0 border-b border-[#dadde1] bg-white px-6 pt-2">
        {(["campaigns", "adsets", "ads"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-[12px] font-semibold transition-colors ${
              activeTab === tab
                ? "border-b-2 border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                : "text-[#65676b] hover:bg-[#f0f2f5]"
            }`}
          >
            {tab === "campaigns" ? "Campaigns" : tab === "adsets" ? "Ad Sets" : "Ads"}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 border-b border-[#dadde1] bg-white px-6 py-2.5">
        <div className="flex items-center gap-1.5">
          {[
            { label: "All", value: "all" },
            { label: "Active", value: "ACTIVE" },
            { label: "Paused", value: "PAUSED" },
            { label: "Archived", value: "ARCHIVED" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === f.value
                  ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                  : "border-[#dadde1] bg-white text-[#1c1e21] hover:bg-[#f0f2f5]"
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="mx-1 h-3 w-px bg-[#dadde1]" />
          {OBJECTIVES.map((o) => (
            <button
              key={o}
              onClick={() => setObjectiveFilter(objectiveFilter === o ? "all" : o)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                objectiveFilter === o
                  ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                  : "border-[#dadde1] bg-white text-[#1c1e21] hover:bg-[#f0f2f5]"
              }`}
            >
              {o.charAt(0) + o.slice(1).toLowerCase().replace("_", " ")}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={() => { setStatusFilter("all"); setObjectiveFilter("all"); setSearch(""); }}
              className="flex items-center gap-1 rounded-full border border-[#dadde1] px-2 py-1 text-[11px] text-[#65676b] hover:bg-[#f0f2f5]"
            >
              <X className="h-2.5 w-2.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="flex items-center justify-between border-b border-[#dadde1] bg-white px-6 py-2">
        <div className="flex items-center gap-1">
          {/* Green Create button */}
          <Button
            size="sm"
            className="rounded-lg bg-[#42b72a] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#36a420]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-1 h-3 w-3" strokeWidth={3} /> Create
          </Button>

          {ui.selected.length > 0 ? (
            <>
              <ToolbarBtn label="Duplicate" onClick={() => bulk("duplicate")} disabled={ui.selected.length === 0} />
              <ToolbarBtn label="Edit" disabled={ui.selected.length === 0} />
              <ToolbarBtn label="A/B test" disabled={ui.selected.length === 0} />
              <div className="relative">
                <ToolbarBtn label="More" suffix={<ChevronDown className="h-3 w-3" />} onClick={() => setShowMoreMenu(!showMoreMenu)} />
                {showMoreMenu && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#dadde1] bg-white py-1 shadow-lg">
                    <DropdownItem label="Activate" onClick={() => { bulk("activate"); setShowMoreMenu(false); }} />
                    <DropdownItem label="Pause" onClick={() => { bulk("pause"); setShowMoreMenu(false); }} />
                    <DropdownItem label="Delete" danger onClick={() => { bulk("delete"); setShowMoreMenu(false); }} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <ToolbarBtn label="More" suffix={<ChevronDown className="h-3 w-3" />} onClick={() => setShowMoreMenu(!showMoreMenu)} />
                {showMoreMenu && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#dadde1] bg-white py-1 shadow-lg">
                    <DropdownItem label="Select all" onClick={() => { ui.selectMany(filtered.map((c) => c.id)); setShowMoreMenu(false); }} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <ToolbarBtn
              label="Columns: Performance"
              suffix={<ChevronDown className="h-3 w-3" />}
              onClick={() => { setShowColumnsMenu(!showColumnsMenu); setShowBreakdownMenu(false); }}
            />
            {showColumnsMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#dadde1] bg-white py-1 shadow-lg">
                <DropdownItem label="Performance" active onClick={() => setShowColumnsMenu(false)} />
                <DropdownItem label="Setup" onClick={() => setShowColumnsMenu(false)} />
                <DropdownItem label="Delivery" onClick={() => setShowColumnsMenu(false)} />
                <DropdownItem label="Video metrics" onClick={() => setShowColumnsMenu(false)} />
              </div>
            )}
          </div>
          <div className="relative">
            <ToolbarBtn
              label="Breakdown"
              suffix={<ChevronDown className="h-3 w-3" />}
              onClick={() => { setShowBreakdownMenu(!showBreakdownMenu); setShowColumnsMenu(false); }}
            />
            {showBreakdownMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[#dadde1] bg-white py-1 shadow-lg">
                <DropdownItem label="None" active onClick={() => setShowBreakdownMenu(false)} />
                <DropdownItem label="By time" onClick={() => setShowBreakdownMenu(false)} />
                <DropdownItem label="By delivery" onClick={() => setShowBreakdownMenu(false)} />
                <DropdownItem label="By action" onClick={() => setShowBreakdownMenu(false)} />
              </div>
            )}
          </div>
          <div className="mx-1 h-4 w-px bg-[#dadde1]" />
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#65676b] transition-colors hover:bg-[#f0f2f5]" title="Open data sources">
            <BarChart3 className="h-4 w-4" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#65676b] transition-colors hover:bg-[#f0f2f5]" title="Reports">
            <Settings2 className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-[#dadde1]" />
          <Button variant="outline" size="sm" className="rounded-lg border-[#dadde1] bg-white text-[11px] font-medium text-[#1c1e21] hover:bg-[#f0f2f5]" onClick={exportSelected}>
            <FileDown className="mr-1 h-3 w-3" /> Export
          </Button>
        </div>
      </div>

      {/* Bulk Actions bar */}
      {ui.selected.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#dadde1] bg-[#e7f3ff] px-6 py-1.5">
          <Checkbox checked={allSelected} onCheckedChange={() => (allSelected ? ui.clearSelect() : ui.selectMany(filtered.map((c) => c.id)))} className="rounded border-[#1877f2]" />
          <span className="text-[12px] font-semibold text-[#1c1e21]">{ui.selected.length} selected</span>
          <div className="mx-1 h-3 w-px bg-[#c5d7f0]" />
          <BulkActionBtn label="Activate" onClick={() => bulk("activate")} />
          <BulkActionBtn label="Pause" onClick={() => bulk("pause")} />
          <BulkActionBtn label="Duplicate" onClick={() => bulk("duplicate")} />
          <BulkActionBtn label="Export" onClick={exportSelected} />
          <BulkActionBtn label="Delete" danger onClick={() => bulk("delete")} />
          <button className="ml-auto text-[11px] text-[#65676b] hover:underline" onClick={ui.clearSelect}>Clear selection</button>
        </div>
      )}

      {/* Table with horizontal scroll */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-3 p-6">{[1, 2, 3, 4].map((i) => (<div key={i} className="h-[44px] animate-pulse rounded bg-[#f0f2f5]" />))}</div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={!!hasFilters} onCreate={() => setCreateOpen(true)} />
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: 1494 }}>
            <thead className="sticky top-0 z-20">
              <tr className="border-b border-[#dadde1] bg-[#f7f8fa]">
                <th className="sticky left-0 z-30 border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5" style={{ width: 44, minWidth: 44 }}>
                  <Checkbox checked={allSelected} onCheckedChange={() => (allSelected ? ui.clearSelect() : ui.selectMany(filtered.map((c) => c.id)))} className="border-[#bcc0c4] rounded-[3px]" />
                </th>
                <th className="sticky left-[44px] z-30 border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5" style={{ width: 80, minWidth: 80 }} />
                <th className="sticky left-[124px] z-30 border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 300, minWidth: 300 }}>Campaign</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 140, minWidth: 140 }}>Delivery</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 170, minWidth: 170 }}>Actions</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 130, minWidth: 130 }}>Results</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 130, minWidth: 130 }}>Cost per result</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 120, minWidth: 120 }}>Budget</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-right text-[11px] font-semibold text-[#65676b]" style={{ width: 130, minWidth: 130 }}>Amount spent</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-right text-[11px] font-semibold text-[#65676b]" style={{ width: 130, minWidth: 130 }}>Impressions</th>
                <th className="border-r border-[#dadde1] bg-[#f7f8fa] px-3 py-2.5 text-right text-[11px] font-semibold text-[#65676b]" style={{ width: 120, minWidth: 120 }}>Reach</th>
                <th className="bg-[#f7f8fa] px-3 py-2.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 100, minWidth: 100 }}>Ends</th>
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

      {/* Summary row */}
      <div className="flex items-center gap-2 border-t border-[#dadde1] bg-white px-6 py-2 text-[12px] text-[#65676b]">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e4e6eb] text-[10px] font-bold italic text-[#65676b]">i</span>
        Results from {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
        <span className="ml-2 text-[#65676b]">· {formatCurrency(totalSpend)} total spend</span>
      </div>

      {/* Drawer & Dialogs */}
      <CampaignDrawer onEditAd={(ad: Ad) => setEditTarget(ad)} />
      <PerformanceControls campaigns={campaigns as Campaign[]} />
      <AdDetailsDrawer />
      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditDialog entity="ad" target={editTarget} onOpenChange={(o) => !o && setEditTarget(null)} />
    </div>
  );
}

function ToolbarBtn({ label, suffix, onClick, disabled }: { label: string; suffix?: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-lg border border-[#dadde1] bg-white px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
      }`}
    >
      {label}{suffix}
    </button>
  );
}

function DropdownItem({ label, active, danger, onClick }: { label: string; active?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-1.5 text-left text-[12px] transition-colors ${
        active ? "bg-[#e7f3ff] text-[#1877f2]" : danger ? "text-[#d32f2f] hover:bg-red-50" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
      }`}
    >
      {label}
    </button>
  );
}

function BulkActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
        danger ? "text-[#d32f2f] hover:bg-red-50" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
      }`}
    >
      {label}
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
        <p className="mt-1 text-[13px] text-[#65676b]">{hasFilters ? "Try adjusting your search or filters." : "Create your first campaign to start managing spend and results."}</p>
      </div>
      {!hasFilters && (
        <Button className="rounded-lg bg-[#42b72a] px-5 font-semibold text-white hover:bg-[#36a420]" onClick={onCreate}>
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
