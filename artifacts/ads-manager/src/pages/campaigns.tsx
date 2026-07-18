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
  Plus, ChevronDown, Search, Megaphone, PlaySquare,
  BarChart3, Settings2, SlidersHorizontal, ArrowUpDown,
  LayoutGrid, FileDown,
} from "lucide-react";
import { resolveExtras, roas, useCampaignExtrasMap } from "@/lib/perf";
import { formatCurrency } from "@/lib/format";
import type { Campaign, Ad } from "@workspace/api-client-react";

function CampaignsInner() {
  const { data: campaigns = [], isLoading } = useListCampaigns({}, { query: { queryKey: getListCampaignsQueryKey() } });
  const [extrasMap] = useCampaignExtrasMap();
  const ui = useCampaignsUI();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    return campaigns.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    }).sort((a, b) => b.amountSpent - a.amountSpent);
  }, [campaigns, search, statusFilter]);

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

  return (
    <div className="flex h-full flex-col bg-white">

      {/* Campaigns / Ad Sets / Ads large connected navigation */}
      <div className="border-b border-[#dadde1] bg-white px-4 pt-3">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex flex-1 items-center justify-between rounded-t-md border border-b-0 px-4 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === "campaigns"
                ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                : "border-[#dadde1] bg-[#f5f6f8] text-[#65676b] hover:bg-[#ebedf0]"
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Campaigns
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${activeTab === "campaigns" ? "bg-[#d2e5fc] text-[#1877f2]" : "bg-[#e4e6eb] text-[#65676b]"}`}>
              {campaigns.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("adsets")}
            className={`flex flex-1 items-center justify-between rounded-t-md border border-b-0 px-4 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === "adsets"
                ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                : "border-[#dadde1] bg-[#f5f6f8] text-[#65676b] hover:bg-[#ebedf0]"
            }`}
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Ad sets
            </span>
            <span className="rounded-full bg-[#e4e6eb] px-2 py-0.5 text-[11px] font-medium text-[#65676b]">0</span>
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={`flex flex-1 items-center justify-between rounded-t-md border border-b-0 px-4 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === "ads"
                ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                : "border-[#dadde1] bg-[#f5f6f8] text-[#65676b] hover:bg-[#ebedf0]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Ads
            </span>
            <span className="rounded-full bg-[#e4e6eb] px-2 py-0.5 text-[11px] font-medium text-[#65676b]">0</span>
          </button>
        </div>
      </div>

      {/* Filter area: top filters + search */}
      <div className="border-b border-[#dadde1] bg-white px-4 py-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          {[
            { label: "All ads", value: "all" },
            { label: "Active ads", value: "ACTIVE" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                statusFilter === f.value
                  ? "border-[#1877f2] bg-[#e7f3ff] text-[#1877f2]"
                  : "border-[#dadde1] bg-white text-[#1c1e21] hover:bg-[#f0f2f5]"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button className="rounded border border-[#dadde1] bg-white px-2.5 py-1 text-[12px] font-medium text-[#1c1e21] hover:bg-[#f0f2f5]">
            Actions
          </button>
          <button className="rounded border border-[#dadde1] bg-white px-2.5 py-1 text-[12px] font-medium text-[#1c1e21] hover:bg-[#f0f2f5]">
            Had delivery
          </button>
          <button className="rounded border border-[#dadde1] bg-white px-2 py-1 text-[12px] font-medium text-[#1877f2] hover:bg-[#e7f3ff]">
            + See more
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#65676b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Describe what you're looking for"
            className="h-8 w-full rounded border border-[#dadde1] bg-white pl-8 pr-3 text-[13px] text-[#1c1e21] outline-none placeholder:text-[#8d949e] focus:border-[#1877f2]"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#dadde1] bg-white px-4 py-1.5">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-[30px] rounded bg-[#42b72a] px-2.5 text-[12px] font-semibold text-white hover:bg-[#36a420]"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-0.5 h-3 w-3" strokeWidth={3} /> Create
          </Button>

          {ui.selected.length > 0 ? (
            <>
              <ToolbarBtn label="Duplicate" onClick={() => bulk("duplicate")} />
              <ToolbarBtn label="Edit" disabled />
              <ToolbarBtn label="A/B test" disabled />
              <div className="relative">
                <ToolbarBtn label="More" suffix={<ChevronDown className="h-2.5 w-2.5" />} onClick={() => setShowMoreMenu(!showMoreMenu)} />
                {showMoreMenu && (
                  <div className="absolute left-0 top-full z-50 mt-0.5 w-44 rounded border border-[#dadde1] bg-white py-0.5 shadow-sm">
                    <DropdownItem label="Activate" onClick={() => { bulk("activate"); setShowMoreMenu(false); }} />
                    <DropdownItem label="Pause" onClick={() => { bulk("pause"); setShowMoreMenu(false); }} />
                    <DropdownItem label="Delete" danger onClick={() => { bulk("delete"); setShowMoreMenu(false); }} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <ToolbarBtn label="Duplicate" disabled />
              <ToolbarBtn label="Edit" disabled />
              <ToolbarBtn label="A/B test" disabled />
              <div className="relative">
                <ToolbarBtn label="More" suffix={<ChevronDown className="h-2.5 w-2.5" />} onClick={() => setShowMoreMenu(!showMoreMenu)} />
                {showMoreMenu && (
                  <div className="absolute left-0 top-full z-50 mt-0.5 w-44 rounded border border-[#dadde1] bg-white py-0.5 shadow-sm">
                    <DropdownItem label="Select all" onClick={() => { ui.selectMany(filtered.map((c) => c.id)); setShowMoreMenu(false); }} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div className="relative">
            <ToolbarBtn label="Columns: Performance" suffix={<ChevronDown className="h-2.5 w-2.5" />} onClick={() => { setShowColumnsMenu(!showColumnsMenu); setShowBreakdownMenu(false); }} />
            {showColumnsMenu && (
              <div className="absolute right-0 top-full z-50 mt-0.5 w-44 rounded border border-[#dadde1] bg-white py-0.5 shadow-sm">
                <DropdownItem label="Performance" active onClick={() => setShowColumnsMenu(false)} />
                <DropdownItem label="Setup" onClick={() => setShowColumnsMenu(false)} />
                <DropdownItem label="Delivery" onClick={() => setShowColumnsMenu(false)} />
              </div>
            )}
          </div>
          <div className="relative">
            <ToolbarBtn label="Breakdown" suffix={<ChevronDown className="h-2.5 w-2.5" />} onClick={() => { setShowBreakdownMenu(!showBreakdownMenu); setShowColumnsMenu(false); }} />
            {showBreakdownMenu && (
              <div className="absolute right-0 top-full z-50 mt-0.5 w-44 rounded border border-[#dadde1] bg-white py-0.5 shadow-sm">
                <DropdownItem label="None" active onClick={() => setShowBreakdownMenu(false)} />
                <DropdownItem label="By time" onClick={() => setShowBreakdownMenu(false)} />
                <DropdownItem label="By delivery" onClick={() => setShowBreakdownMenu(false)} />
              </div>
            )}
          </div>
          <div className="mx-0.5 h-3.5 w-px bg-[#dadde1]" />
          <button className="flex h-[30px] w-[30px] items-center justify-center rounded text-[#65676b] transition-colors hover:bg-[#f0f2f5]" title="Reports">
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-[30px] w-[30px] items-center justify-center rounded text-[#65676b] transition-colors hover:bg-[#f0f2f5]" title="Settings">
            <Settings2 className="h-3.5 w-3.5" />
          </button>
          <div className="mx-0.5 h-3.5 w-px bg-[#dadde1]" />
          <button className="flex h-[30px] items-center gap-1 rounded border border-[#dadde1] bg-white px-2 text-[12px] font-medium text-[#1c1e21] transition-colors hover:bg-[#f0f2f5]" onClick={exportSelected}>
            <FileDown className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Bulk Actions bar */}
      {ui.selected.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#dadde1] bg-[#e7f3ff] px-4 py-1">
          <Checkbox checked={allSelected} onCheckedChange={() => (allSelected ? ui.clearSelect() : ui.selectMany(filtered.map((c) => c.id)))} className="rounded border-[#1877f2]" />
          <span className="text-[12px] font-semibold text-[#1c1e21]">{ui.selected.length} selected</span>
          <div className="mx-0.5 h-3 w-px bg-[#c5d7f0]" />
          <BulkActionBtn label="Activate" onClick={() => bulk("activate")} />
          <BulkActionBtn label="Pause" onClick={() => bulk("pause")} />
          <BulkActionBtn label="Duplicate" onClick={() => bulk("duplicate")} />
          <BulkActionBtn label="Export" onClick={exportSelected} />
          <BulkActionBtn label="Delete" danger onClick={() => bulk("delete")} />
          <button className="ml-auto text-[11px] text-[#65676b] hover:underline" onClick={ui.clearSelect}>Clear selection</button>
        </div>
      )}

      {/* Table + horizontal scroll wrapper */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-0 p-4">{[1, 2, 3, 4].map((i) => (<div key={i} className="h-[40px] animate-pulse border-b border-[#dadde1] bg-[#f0f2f5]" />))}</div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={!!search || statusFilter !== "all"} onCreate={() => setCreateOpen(true)} />
        ) : (
          <>
            <table className="w-full border-collapse" style={{ minWidth: 1400 }}>
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-[#dadde1] bg-[#f5f6f8]">
                  <th className="sticky left-0 z-30 border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5" style={{ width: 40, minWidth: 40 }}>
                    <Checkbox checked={allSelected} onCheckedChange={() => (allSelected ? ui.clearSelect() : ui.selectMany(filtered.map((c) => c.id)))} className="border-[#bcc0c4] rounded-[3px]" />
                  </th>
                  <th className="sticky left-[40px] z-30 border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-center text-[11px] font-semibold text-[#65676b]" style={{ width: 64, minWidth: 64 }}>
                    Off / On
                  </th>
                  <th className="sticky left-[104px] z-30 border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 280, minWidth: 280 }}>
                    <span className="inline-flex items-center gap-1">Campaign <ArrowUpDown className="h-2.5 w-2.5 text-[#bcc0c4]" /></span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-left text-[11px] font-semibold" style={{ width: 130, minWidth: 130 }}>
                    <span className="inline-flex items-center gap-1 text-[#1877f2]">Delivery <ChevronDown className="h-2.5 w-2.5" /></span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 120, minWidth: 120 }}>
                    <span className="inline-flex items-center gap-1">Actions</span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 120, minWidth: 120 }}>
                    <span className="inline-flex items-center gap-1">Results <ArrowUpDown className="h-2.5 w-2.5 text-[#bcc0c4]" /></span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 120, minWidth: 120 }}>
                    <span className="inline-flex items-center gap-1">Cost per result <ArrowUpDown className="h-2.5 w-2.5 text-[#bcc0c4]" /></span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 110, minWidth: 110 }}>
                    <span className="inline-flex items-center gap-1">Budget</span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-right text-[11px] font-semibold text-[#65676b]" style={{ width: 110, minWidth: 110 }}>
                    <span className="inline-flex items-center gap-1">Amount spent <ArrowUpDown className="h-2.5 w-2.5 text-[#bcc0c4]" /></span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-right text-[11px] font-semibold text-[#65676b]" style={{ width: 110, minWidth: 110 }}>
                    <span className="inline-flex items-center gap-1">Impressions <ArrowUpDown className="h-2.5 w-2.5 text-[#bcc0c4]" /></span>
                  </th>
                  <th className="border-r border-[#dadde1] bg-[#f5f6f8] px-2 py-1.5 text-right text-[11px] font-semibold text-[#65676b]" style={{ width: 100, minWidth: 100 }}>
                    <span className="inline-flex items-center gap-1">Reach <ArrowUpDown className="h-2.5 w-2.5 text-[#bcc0c4]" /></span>
                  </th>
                  <th className="bg-[#f5f6f8] px-2 py-1.5 text-left text-[11px] font-semibold text-[#65676b]" style={{ width: 90, minWidth: 90 }}>
                    <span className="inline-flex items-center gap-1">Ends</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={i} />
                ))}
              </tbody>
            </table>

            {/* Summary row directly below table */}
            <div className="flex items-center gap-1.5 border-b border-[#dadde1] bg-white px-4 py-1.5 text-[12px] text-[#65676b]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e4e6eb] text-[10px] font-bold text-[#65676b]">i</span>
              Results from {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
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
      className={`flex h-[30px] items-center gap-1 rounded border border-[#dadde1] bg-white px-2 text-[12px] font-medium transition-colors ${
        disabled ? "cursor-not-allowed opacity-40" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
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
      className={`w-full px-2.5 py-1 text-left text-[12px] transition-colors ${
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
      className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
        danger ? "text-[#d32f2f] hover:bg-red-50" : "text-[#1c1e21] hover:bg-[#f0f2f5]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
        {hasFilters ? <PlaySquare className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
      </span>
      <div>
        <h3 className="text-[14px] font-semibold text-[#1c1e21]">{hasFilters ? "No campaigns match your filters" : "No campaigns yet"}</h3>
        <p className="mt-0.5 text-[12px] text-[#65676b]">{hasFilters ? "Try adjusting your search or filters." : "Create your first campaign to start managing spend and results."}</p>
      </div>
      {!hasFilters && (
        <Button className="rounded bg-[#42b72a] px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-[#36a420]" onClick={onCreate}>
          <Plus className="mr-1 h-3 w-3" strokeWidth={3} /> Create campaign
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
