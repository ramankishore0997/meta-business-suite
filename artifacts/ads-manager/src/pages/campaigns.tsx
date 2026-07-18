import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCampaigns,
  getListCampaignsQueryKey,
  useToggleCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
  getListAdSetsQueryKey,
  getListAdsQueryKey,
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  Download,
  X,
  Megaphone,
  PlaySquare,
} from "lucide-react";
import {
  resolveExtras,
  roas,
  placementsFor,
  useCampaignExtrasMap,
  PLACEMENTS,
} from "@/lib/perf";
import { formatCurrency } from "@/lib/format";
import type { Campaign, Ad } from "@workspace/api-client-react";

const OBJECTIVES = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "APP_PROMOTION", "SALES", "MESSAGES"];

function CampaignsInner() {
  const { data: campaigns = [], isLoading } = useListCampaigns(
    {},
    { query: { queryKey: getListCampaignsQueryKey() } },
  );
  const [extrasMap] = useCampaignExtrasMap();
  const ui = useCampaignsUI();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [sortBy, setSortBy] = useState("spend");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const toggle = useToggleCampaign();
  const del = useDeleteCampaign();
  const dup = useDuplicateCampaign();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist + restore scroll position.
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
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
    };
  }, [isLoading]);

  // Keyboard shortcuts: ⌘N create, ESC clear selection.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setCreateOpen(true);
      }
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
      if (placementFilter !== "all" && !placementsFor(c.id).some((p) => p.key === placementFilter)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "spend") return b.amountSpent - a.amountSpent;
      if (sortBy === "results") return b.results - a.results;
      if (sortBy === "roas")
        return roas(resolveExtras(b, extrasMap).revenue, b.amountSpent) - roas(resolveExtras(a, extrasMap).revenue, a.amountSpent);
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
    return list;
  }, [campaigns, search, statusFilter, objectiveFilter, placementFilter, sortBy, extrasMap]);

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
      if (done === ids.length) {
        invalidateAll();
        ui.clearSelect();
        toast({ title: `Bulk ${action} complete`, description: `${ids.length} campaign(s) updated` });
      }
    };
    ids.forEach((id) => {
      const c = campaigns.find((x) => x.id === id);
      if (action === "delete") del.mutate({ id }, { onSuccess: finish, onError: finish });
      else if (action === "duplicate") dup.mutate({ id }, { onSuccess: finish, onError: finish });
      else {
        const wantActive = action === "activate";
        if (c && (c.status === "ACTIVE") !== wantActive) toggle.mutate({ id }, { onSuccess: finish, onError: finish });
        else finish();
      }
    });
  };

  const exportSelected = () => {
    const rows = (selectedCampaigns.length ? selectedCampaigns : filtered).map((c) => {
      const ex = resolveExtras(c, extrasMap);
      return {
        Name: c.name,
        Objective: c.objective,
        Status: c.status,
        Spend: c.amountSpent,
        Revenue: ex.revenue,
        ROAS: roas(ex.revenue, c.amountSpent).toFixed(2),
        Results: c.results,
        CTR: c.ctr ?? 0,
        Reach: c.reach,
        Impressions: c.impressions,
      };
    });
    const headers = Object.keys(rows[0] ?? { Name: "" });
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String((r as Record<string, unknown>)[h] ?? "")}"`).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "campaigns.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${rows.length} campaign(s)` });
  };

  const allSelected = filtered.length > 0 && filtered.every((c) => ui.selected.includes(c.id));
  const totalSpend = filtered.reduce((s, c) => s + c.amountSpent, 0);
  const hasFilters = search || statusFilter !== "all" || objectiveFilter !== "all" || placementFilter !== "all";

  return (
    <div className="app-aurora flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60 bg-card/40 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-3 pt-5">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} campaigns · {formatCurrency(totalSpend)} managed spend
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={exportSelected}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" className="rounded-full px-4 font-semibold shadow-md" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" strokeWidth={3} />
              Create
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="h-9 w-[220px] rounded-full bg-background/60 pl-9 text-sm"
            />
          </div>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} placeholder="Status" options={[["all", "All statuses"], ["ACTIVE", "Active"], ["PAUSED", "Paused"], ["ARCHIVED", "Archived"]]} />
          <FilterSelect value={objectiveFilter} onChange={setObjectiveFilter} placeholder="Objective" options={[["all", "All objectives"], ...OBJECTIVES.map((o) => [o, o.charAt(0) + o.slice(1).toLowerCase().replace("_", " ")] as [string, string])]} />
          <FilterSelect value={placementFilter} onChange={setPlacementFilter} placeholder="Placement" options={[["all", "All placements"], ...PLACEMENTS.map((p) => [p.key, p.label] as [string, string])]} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort</span>
            <FilterSelect value={sortBy} onChange={setSortBy} placeholder="Sort" options={[["spend", "Top spend"], ["roas", "Best ROAS"], ["results", "Most results"], ["recent", "Newest"]]} />
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setObjectiveFilter("all");
                  setPlacementFilter("all");
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Bulk action bar */}
        {ui.selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-primary/5 px-6 py-2.5 duration-150 animate-in fade-in slide-in-from-top-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => (allSelected ? ui.clearSelect() : ui.selectMany(filtered.map((c) => c.id)))}
              className="rounded-[5px]"
            />
            <span className="text-sm font-semibold text-foreground">{ui.selected.length} selected</span>
            <div className="mx-1 h-4 w-px bg-border" />
            <BulkBtn icon={<Play className="h-3.5 w-3.5" />} label="Activate" onClick={() => bulk("activate")} />
            <BulkBtn icon={<Pause className="h-3.5 w-3.5" />} label="Pause" onClick={() => bulk("pause")} />
            <BulkBtn icon={<Copy className="h-3.5 w-3.5" />} label="Duplicate" onClick={() => bulk("duplicate")} />
            <BulkBtn icon={<Download className="h-3.5 w-3.5" />} label="Export" onClick={exportSelected} />
            <BulkBtn icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" danger onClick={() => bulk("delete")} />
            <Button variant="ghost" size="sm" className="ml-auto rounded-full text-muted-foreground" onClick={ui.clearSelect}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* List */}
      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={!!hasFilters} onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="space-y-3 pb-24">
            {filtered.map((c, i) => (
              <CampaignCard key={c.id} campaign={c} index={i} />
            ))}
          </div>
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

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-full bg-background/60 text-xs font-medium">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function BulkBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={danger ? "rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" : "rounded-full"}
      onClick={onClick}
    >
      {icon}
      <span className="ml-1.5">{label}</span>
    </Button>
  );
}

function EmptyState({ hasFilters, onCreate }: { hasFilters: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {hasFilters ? <PlaySquare className="h-7 w-7" /> : <Megaphone className="h-7 w-7" />}
      </span>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{hasFilters ? "No campaigns match your filters" : "No campaigns yet"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasFilters ? "Try adjusting your search or filters." : "Create your first campaign to start managing spend and results."}
        </p>
      </div>
      {!hasFilters && (
        <Button className="rounded-full px-5 font-semibold shadow-md" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={3} />
          Create campaign
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
