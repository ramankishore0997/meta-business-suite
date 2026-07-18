import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useListCampaigns, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bell,
  ChevronDown,
  Moon,
  Plus,
  RefreshCcw,
  Search,
  Sun,
  Check,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useClients, useLocalStore } from "@/lib/store";
import { CreateDialog } from "@/components/create-dialog";

const STORAGE_KEY = "adAccount";
const DEFAULT_ACCOUNT = { name: "Meta Business Suite", id: "392019485" };
type Account = { name: string; id: string };

function loadAccount(): Account {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Account>;
      return {
        name: parsed.name?.trim() || DEFAULT_ACCOUNT.name,
        id: parsed.id?.trim() || DEFAULT_ACCOUNT.id,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACCOUNT;
}

const PAGES = [
  { label: "Dashboard", href: "/" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Ad Sets", href: "/adsets" },
  { label: "Ads", href: "/ads" },
  { label: "Creative Gallery", href: "/creatives" },
  { label: "Client Portal", href: "/portal" },
  { label: "Clients", href: "/clients" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reports", href: "/reports" },
  { label: "Invoices", href: "/invoices" },
  { label: "Billing", href: "/billing" },
  { label: "Integrations", href: "/integrations" },
  { label: "Team", href: "/team" },
  { label: "Settings", href: "/settings" },
];

export function TopHeader() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: campaigns = [] } = useListCampaigns({}, { query: { queryKey: getListCampaignsQueryKey() } });
  const [clients] = useClients();

  const [account, setAccount] = useState<Account>(DEFAULT_ACCOUNT);
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [idDraft, setIdDraft] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [theme, setTheme] = useLocalStore<"dark" | "light">("theme", "dark");
  const [activeClientId, setActiveClientId] = useLocalStore<string>("activeClientId", "all");

  useEffect(() => setAccount(loadAccount()), []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const alerts = useMemo(() => {
    const list: { id: string; type: "budget" | "ctr" | "learning"; title: string; detail: string }[] = [];
    for (const c of campaigns) {
      if (c.amountSpent > 5000) {
        list.push({ id: `b-${c.id}`, type: "budget", title: "High spend detected", detail: `${c.name} has spent $${c.amountSpent.toLocaleString()}` });
      }
      if (c.ctr !== null && c.ctr < 1 && c.impressions > 0) {
        list.push({ id: `c-${c.id}`, type: "ctr", title: "Low CTR warning", detail: `${c.name} CTR is ${c.ctr.toFixed(2)}%` });
      }
      if (c.delivery === "learning") {
        list.push({ id: `l-${c.id}`, type: "learning", title: "Learning phase", detail: `${c.name} is still optimizing` });
      }
    }
    return list.slice(0, 6);
  }, [campaigns]);

  async function handleRefresh() {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
    toast({ title: "Data refreshed", description: "Latest metrics loaded across all views." });
  }

  function save() {
    const next: Account = {
      name: nameDraft.trim() || DEFAULT_ACCOUNT.name,
      id: idDraft.trim() || DEFAULT_ACCOUNT.id,
    };
    setAccount(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setOpen(false);
  }

  const activeClient = clients.find((c) => c.id === activeClientId);

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-6">
      {/* Search */}
      <button
        onClick={() => setCmdOpen(true)}
        className="group flex h-9 w-full max-w-[340px] items-center gap-2.5 rounded-xl border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/70"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search campaigns, pages…</span>
        <kbd className="hidden rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Client switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden h-9 gap-2 rounded-xl border-border bg-muted/40 text-xs font-semibold md:flex">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeClient?.logoColor ?? "hsl(var(--primary))" }} />
              {activeClient ? activeClient.company : "All Clients"}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Switch client</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveClientId("all")}>
              <span className="flex-1">All Clients</span>
              {activeClientId === "all" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            {clients.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => setActiveClientId(c.id)}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.logoColor }} />
                <span className="flex-1 truncate">{c.company}</span>
                {activeClientId === c.id && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground" title="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              {alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {alerts.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Alerts</p>
              <span className="text-xs text-muted-foreground">{alerts.length} active</span>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
                  <Sparkles className="h-6 w-6 text-primary" />
                  All campaigns healthy.
                </div>
              ) : (
                alerts.map((a) => {
                  const Icon = a.type === "ctr" ? TrendingDown : a.type === "learning" ? Sparkles : AlertTriangle;
                  const tone = a.type === "ctr" ? "text-destructive" : a.type === "learning" ? "text-primary" : "text-warning";
                  return (
                    <div key={a.id} className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-0">
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{a.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{a.detail}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          title="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          title="Refresh data"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCcw className={cn("h-[18px] w-[18px]", refreshing && "animate-spin")} />
        </Button>

        {/* Create */}
        <Button
          size="sm"
          className="h-9 gap-1.5 rounded-xl px-3 font-semibold shadow-lg shadow-primary/25 md:px-4"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          <span className="hidden sm:inline">Create</span>
        </Button>
        <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />

        <div className="mx-1 hidden h-6 w-px bg-border md:block" />

        {/* Profile */}
        <button
          onClick={() => {
            setNameDraft(account.name);
            setIdDraft(account.id);
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl p-0.5 pr-2 transition-colors hover:bg-muted/60"
          title="Workspace settings"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-indigo-500 text-xs font-bold text-primary-foreground">
              {account.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground md:block" />
        </button>
      </div>

      {/* Command palette */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Search pages and campaigns…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((p) => (
              <CommandItem
                key={p.href}
                value={p.label}
                onSelect={() => {
                  navigate(p.href);
                  setCmdOpen(false);
                }}
              >
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
          {campaigns.length > 0 && (
            <CommandGroup heading="Campaigns">
              {campaigns.slice(0, 8).map((c) => (
                <CommandItem
                  key={c.id}
                  value={`campaign ${c.name}`}
                  onSelect={() => {
                    navigate(`/adsets?campaignId=${c.id}`);
                    setCmdOpen(false);
                  }}
                >
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Workspace editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-hidden rounded-2xl border-border p-0 shadow-2xl">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Workspace</DialogTitle>
              <DialogDescription>Configure your agency workspace name and billing ID.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-6">
              <div className="grid gap-2">
                <Label htmlFor="account-name" className="text-xs uppercase tracking-wider text-muted-foreground">Workspace Name</Label>
                <Input id="account-name" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="e.g. Meta Business Suite" className="h-11" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-id" className="text-xs uppercase tracking-wider text-muted-foreground">Billing ID</Label>
                <Input id="account-id" value={idDraft} onChange={(e) => setIdDraft(e.target.value)} placeholder="e.g. 392019485" className="h-11 font-mono" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-border bg-muted/30 p-4 px-6">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={save} className="rounded-full px-6 font-semibold shadow-md">Save Details</Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
