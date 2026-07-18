import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateCampaign } from "@workspace/api-client-react";
import { useCampaignsUI } from "./context";
import {
  useCampaignExtrasMap,
  resolveExtras,
  cpc,
  roas,
  cpl,
  formatRoas,
  type CampaignExtras,
} from "@/lib/perf";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, ChevronDown, Save, RotateCcw, Undo2, Zap } from "lucide-react";
import type { Campaign } from "@workspace/api-client-react";

type Editable = {
  amountSpent: string;
  costPerResult: string;
  revenue: string;
  leads: string;
  purchases: string;
};

function toEditable(c: Campaign, extras: CampaignExtras): Editable {
  return {
    amountSpent: String(c.amountSpent ?? 0),
    costPerResult: c.costPerResult != null ? String(c.costPerResult) : "",
    revenue: String(extras.revenue),
    leads: String(extras.leads),
    purchases: String(extras.purchases),
  };
}

function eq(a: Editable, b: Editable): boolean {
  return (
    a.amountSpent === b.amountSpent &&
    a.costPerResult === b.costPerResult &&
    a.revenue === b.revenue &&
    a.leads === b.leads &&
    a.purchases === b.purchases
  );
}

export function PerformanceControls({ campaigns }: { campaigns: Campaign[] }) {
  const { activeCampaignId, openPerf, perfNonce } = useCampaignsUI();
  const [collapsed, setCollapsed] = useState(true);

  // Expand the panel whenever openPerf is triggered (Controls button, drawer
  // "Open controls", etc.) even if the user had previously collapsed it.
  useEffect(() => {
    if (perfNonce > 0) setCollapsed(false);
  }, [perfNonce]);
  const [extrasMap, setExtrasMap] = useCampaignExtrasMap();
  const queryClient = useQueryClient();
  const updateCampaign = useUpdateCampaign();
  const { toast } = useToast();

  const campaign = useMemo(
    () => campaigns.find((c) => c.id === activeCampaignId) ?? campaigns[0] ?? null,
    [campaigns, activeCampaignId],
  );

  const resolved = campaign ? resolveExtras(campaign, extrasMap) : null;
  const baselineRef = useRef<Editable | null>(null);
  const [form, setForm] = useState<Editable | null>(null);
  const savingRef = useRef(false);
  const loadedIdRef = useRef<number | null>(null);

  // (Re)load form when the active campaign changes or its server data updates.
  useEffect(() => {
    if (!campaign || !resolved) {
      setForm(null);
      baselineRef.current = null;
      loadedIdRef.current = null;
      return;
    }
    const switched = loadedIdRef.current !== campaign.id;
    // Skip only same-campaign server echoes while WE are saving; a campaign
    // switch must always rehydrate so a pending save can't target the wrong one.
    if (!switched && savingRef.current) return;
    if (switched) savingRef.current = false;
    const next = toEditable(campaign, resolved);
    baselineRef.current = next;
    loadedIdRef.current = campaign.id;
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.id, campaign?.amountSpent, campaign?.costPerResult]);

  const dirty = !!(form && baselineRef.current && !eq(form, baselineRef.current));

  function persist(f: Editable, opts?: { silent?: boolean }) {
    if (!campaign) return;
    const targetId = campaign.id;
    const targetName = campaign.name;
    const spend = parseFloat(f.amountSpent) || 0;
    const cprVal = parseFloat(f.costPerResult);
    savingRef.current = true;

    setExtrasMap((prev) => ({
      ...prev,
      [String(targetId)]: {
        ...(prev[String(targetId)] ?? {}),
        revenue: parseFloat(f.revenue) || 0,
        leads: parseFloat(f.leads) || 0,
        purchases: parseFloat(f.purchases) || 0,
      },
    }));

    updateCampaign.mutate(
      {
        id: targetId,
        data: {
          amountSpent: spend,
          costPerResult: !isNaN(cprVal) && cprVal > 0 ? cprVal : null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          // Only touch live panel state if we're still on the saved campaign;
          // otherwise the user switched away and this callback must not clobber it.
          if (loadedIdRef.current === targetId) {
            baselineRef.current = f;
            savingRef.current = false;
          }
          if (!opts?.silent) toast({ title: "Performance saved", description: targetName });
        },
        onError: () => {
          if (loadedIdRef.current === targetId) savingRef.current = false;
          toast({ title: "Failed to save", variant: "destructive" });
        },
      },
    );
  }

  // Debounced autosave.
  useEffect(() => {
    if (!dirty || !form) return;
    const t = setTimeout(() => persist(form, { silent: true }), 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, dirty]);

  // ⌘S / Ctrl+S forces an immediate save when the panel is open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && !collapsed && form) {
        e.preventDefault();
        persist(form);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed, form]);

  if (!campaign || !form) return null;

  const spend = parseFloat(form.amountSpent) || 0;
  const cprVal = parseFloat(form.costPerResult) || 0;
  const revenue = parseFloat(form.revenue) || 0;
  const leads = parseFloat(form.leads) || 0;
  const results = cprVal > 0 ? Math.round(spend / cprVal) : campaign.results;
  const derivedRoas = roas(revenue, spend);
  const derivedCpc = cpc(spend, campaign.clicks);
  const derivedCpl = cpl(spend, leads);

  const set = (patch: Partial<Editable>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[min(390px,calc(100vw-2.5rem))]">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="glass-strong hover-glow group flex w-full items-center gap-3 rounded-2xl border border-primary/25 px-4 py-3 text-left shadow-2xl transition-all"
        >
          <span className="glow-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold tracking-tight text-foreground">Performance Controls</span>
            <span className="block truncate text-xs text-muted-foreground">{campaign.name}</span>
          </span>
          {dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-warning shadow-[0_0_8px_hsl(var(--warning))]" />}
          <ChevronDown className="h-4 w-4 shrink-0 rotate-180 text-muted-foreground transition-transform group-hover:text-foreground" />
        </button>
      ) : (
        <div className="glass-strong flex max-h-[82vh] flex-col overflow-hidden rounded-2xl border border-primary/20 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="glow-primary flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground">
                <Zap className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold tracking-tight">Performance Controls</div>
                <div className="text-[11px] text-muted-foreground">{dirty ? "Unsaved changes" : "All changes saved"}</div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Collapse"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div>
              <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Campaign
              </Label>
              <Select value={String(campaign.id)} onValueChange={(v) => openPerf(Number(v))}>
                <SelectTrigger className="h-9 rounded-lg bg-background/60 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Spend ($)" value={form.amountSpent} onChange={(v) => set({ amountSpent: v })} accent />
              <Field label="Cost / Result ($)" value={form.costPerResult} placeholder="Auto" onChange={(v) => set({ costPerResult: v })} />
              <Field label="Revenue ($)" value={form.revenue} onChange={(v) => set({ revenue: v })} />
              <Field label="Leads" value={form.leads} onChange={(v) => set({ leads: v })} />
              <Field label="Purchases" value={form.purchases} onChange={(v) => set({ purchases: v })} />
              <div className="rounded-lg border border-border bg-background/40 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Results</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-foreground">{formatNumber(results)}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live derived metrics</div>
              <div className="grid grid-cols-3 gap-2">
                <Derived label="ROAS" value={formatRoas(derivedRoas)} tone={derivedRoas >= 2 ? "success" : derivedRoas >= 1 ? "warning" : "danger"} />
                <Derived label="CPC" value={formatCurrency(derivedCpc)} />
                <Derived label="CPL" value={formatCurrency(derivedCpl)} />
                <Derived label="CPM" value={formatCurrency(campaign.cpm ?? 0)} />
                <Derived label="CTR" value={`${(campaign.ctr ?? 0).toFixed(2)}%`} />
                <Derived label="Freq." value={(campaign.frequency ?? 0).toFixed(2)} />
                <Derived label="Reach" value={formatNumber(campaign.reach)} />
                <Derived label="Impr." value={formatNumber(campaign.impressions)} />
                <Derived label="Clicks" value={formatNumber(campaign.clicks)} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border/60 px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground"
              disabled={!dirty}
              onClick={() => baselineRef.current && setForm(baselineRef.current)}
              title="Undo unsaved changes"
            >
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-muted-foreground"
              onClick={() => {
                if (!campaign) return;
                setExtrasMap((prev) => {
                  const next = { ...prev };
                  delete next[String(campaign.id)];
                  return next;
                });
                const fresh = toEditable(campaign, resolveExtras(campaign, {}));
                baselineRef.current = fresh;
                setForm(fresh);
                toast({ title: "Reset to defaults", description: campaign.name });
              }}
              title="Reset to derived defaults"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              className="ml-auto rounded-full px-5 font-semibold shadow-md"
              disabled={updateCampaign.isPending}
              onClick={() => form && persist(form)}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {updateCampaign.isPending ? "Saving" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <Label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-9 rounded-lg bg-background/60 font-mono text-sm font-semibold", accent && "border-primary/40 text-primary")}
      />
    </div>
  );
}

function Derived({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "danger" }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 px-2.5 py-1.5">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-0.5 font-mono text-xs font-bold",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-destructive",
          !tone && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}
