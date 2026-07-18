import { useCallback, useEffect, useState } from "react";

/**
 * Lightweight reactive localStorage store. New agency entities (clients,
 * invoices, team members, integrations, settings) are persisted client-side,
 * consistent with the existing crypto-payments precedent. Every mutation
 * broadcasts a same-tab event so all mounted hooks stay in sync.
 */

function readRaw<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const EVENT = "local-store-change";

function writeRaw<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
  } catch {
    // ignore quota / serialization errors
  }
}

export function useLocalStore<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readRaw(key, initial));

  useEffect(() => {
    function sync(e: Event) {
      if (e instanceof StorageEvent) {
        if (e.key !== null && e.key !== key) return;
      } else {
        const detail = (e as CustomEvent).detail as { key?: string } | undefined;
        if (detail?.key && detail.key !== key) return;
      }
      setValue(readRaw(key, initial));
    }
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeRaw(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, set];
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* ------------------------------------------------------------------ */
/* Entity types                                                        */
/* ------------------------------------------------------------------ */

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: "active" | "onboarding" | "paused";
  monthlyBudget: number;
  logoColor: string;
  createdAt: string;
};

export type Invoice = {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  issued: string;
  due: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Manager" | "Analyst" | "Viewer";
  status: "active" | "invited";
  color: string;
};

export type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  accent: string;
};

export type AgencySettings = {
  agencyName: string;
  contactEmail: string;
  currency: string;
  timezone: string;
  weeklyReports: boolean;
  budgetAlerts: boolean;
  lowCtrAlerts: boolean;
  whiteLabel: boolean;
  accentHue: number;
};

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const SEED_CLIENTS: Client[] = [
  { id: "cl_1", name: "Aria Vance", company: "Lumen Retail", email: "aria@lumen.co", status: "active", monthlyBudget: 42000, logoColor: "#3B82F6", createdAt: "2026-01-12" },
  { id: "cl_2", name: "Marcus Reed", company: "Northwind Labs", email: "marcus@northwind.io", status: "active", monthlyBudget: 78000, logoColor: "#10B981", createdAt: "2026-02-03" },
  { id: "cl_3", name: "Sofia Marin", company: "Halo Beauty", email: "sofia@halobeauty.com", status: "onboarding", monthlyBudget: 25000, logoColor: "#F59E0B", createdAt: "2026-03-19" },
  { id: "cl_4", name: "Dev Patel", company: "Voltage EV", email: "dev@voltage.dev", status: "paused", monthlyBudget: 15000, logoColor: "#EF4444", createdAt: "2026-04-08" },
];

const SEED_INVOICES: Invoice[] = [
  { id: "in_1", number: "INV-2041", client: "Lumen Retail", amount: 12400, status: "paid", issued: "2026-05-01", due: "2026-05-15" },
  { id: "in_2", number: "INV-2042", client: "Northwind Labs", amount: 26800, status: "pending", issued: "2026-06-01", due: "2026-06-15" },
  { id: "in_3", number: "INV-2043", client: "Halo Beauty", amount: 8600, status: "overdue", issued: "2026-05-18", due: "2026-06-01" },
  { id: "in_4", number: "INV-2044", client: "Voltage EV", amount: 5200, status: "paid", issued: "2026-06-04", due: "2026-06-18" },
];

const SEED_TEAM: TeamMember[] = [
  { id: "tm_1", name: "Jordan Diaz", email: "jordan@metabs.dev", role: "Owner", status: "active", color: "#3B82F6" },
  { id: "tm_2", name: "Priya Nair", email: "priya@metabs.dev", role: "Admin", status: "active", color: "#10B981" },
  { id: "tm_3", name: "Liam Chen", email: "liam@metabs.dev", role: "Manager", status: "active", color: "#F59E0B" },
  { id: "tm_4", name: "Emma Wolf", email: "emma@metabs.dev", role: "Analyst", status: "invited", color: "#A855F7" },
];

const SEED_INTEGRATIONS: Integration[] = [
  { id: "meta", name: "Meta Ads", category: "Advertising", description: "Sync campaigns, ad sets and ads from Meta Business.", connected: true, accent: "#3B82F6" },
  { id: "google", name: "Google Ads", category: "Advertising", description: "Import search and display performance data.", connected: true, accent: "#EA4335" },
  { id: "tiktok", name: "TikTok Ads", category: "Advertising", description: "Pull spend and results from TikTok for Business.", connected: false, accent: "#25F4EE" },
  { id: "ga4", name: "Google Analytics 4", category: "Analytics", description: "Attribute conversions with GA4 events.", connected: true, accent: "#F59E0B" },
  { id: "slack", name: "Slack", category: "Notifications", description: "Send performance alerts to your workspace.", connected: false, accent: "#611f69" },
  { id: "stripe", name: "Stripe", category: "Billing", description: "Reconcile client invoices and payouts.", connected: false, accent: "#635BFF" },
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Push qualified leads to your CRM pipeline.", connected: false, accent: "#FF7A59" },
  { id: "zapier", name: "Zapier", category: "Automation", description: "Automate workflows across 6,000+ apps.", connected: false, accent: "#FF4A00" },
];

export const DEFAULT_SETTINGS: AgencySettings = {
  agencyName: "Meta Business Suite for Developers",
  contactEmail: "hello@metabs.dev",
  currency: "USD",
  timezone: "America/New_York",
  weeklyReports: true,
  budgetAlerts: true,
  lowCtrAlerts: true,
  whiteLabel: false,
  accentHue: 217,
};

/* ------------------------------------------------------------------ */
/* Typed hooks                                                         */
/* ------------------------------------------------------------------ */

export const useClients = () => useLocalStore<Client[]>("clients", SEED_CLIENTS);
export const useInvoices = () => useLocalStore<Invoice[]>("invoices", SEED_INVOICES);
export const useTeam = () => useLocalStore<TeamMember[]>("teamMembers", SEED_TEAM);
export const useIntegrations = () => useLocalStore<Integration[]>("integrations", SEED_INTEGRATIONS);
export const useSettings = () => useLocalStore<AgencySettings>("agencySettings", DEFAULT_SETTINGS);

/* ------------------------------------------------------------------ */
/* Trust & client-portal entities                                      */
/* ------------------------------------------------------------------ */

export type Goal = {
  id: string;
  label: string;
  metric: "leads" | "revenue" | "spend" | "roas";
  target: number;
};

const SEED_GOALS: Goal[] = [
  { id: "g_leads", label: "Monthly Leads", metric: "leads", target: 12000 },
  { id: "g_revenue", label: "Attributed Revenue", metric: "revenue", target: 1600000 },
  { id: "g_spend", label: "Managed Ad Spend", metric: "spend", target: 4000 },
  { id: "g_roas", label: "Target ROAS", metric: "roas", target: 4 },
];

export const useGoals = () => useLocalStore<Goal[]>("agencyGoals", SEED_GOALS);

export type OptimizationEntry = {
  id: string;
  date: string;
  action: string;
  impact: string;
  positive: boolean;
  by: string;
};

const SEED_OPTIMIZATIONS: OptimizationEntry[] = [
  { id: "op_1", date: "2026-07-02", action: "Shifted budget to top-performing Reels ad set", impact: "CPL -12%", positive: true, by: "Priya Nair" },
  { id: "op_2", date: "2026-07-01", action: "Paused a fatigued creative, launched a fresh variant", impact: "CTR +18%", positive: true, by: "Jordan Diaz" },
  { id: "op_3", date: "2026-06-30", action: "Refined lookalike audience to 1% high-LTV", impact: "ROAS +0.6x", positive: true, by: "Liam Chen" },
  { id: "op_4", date: "2026-06-28", action: "Excluded low-intent placements from delivery", impact: "Wasted spend -9%", positive: true, by: "Emma Wolf" },
  { id: "op_5", date: "2026-06-26", action: "Raised daily budget on the winning campaign", impact: "Leads +240", positive: true, by: "Priya Nair" },
  { id: "op_6", date: "2026-06-24", action: "A/B tested a new hook in the primary text", impact: "CTR +7%", positive: true, by: "Jordan Diaz" },
];

export const useOptimizations = () => useLocalStore<OptimizationEntry[]>("optimizationLog", SEED_OPTIMIZATIONS);

export type Creative = {
  id: string;
  title: string;
  url: string;
  placement: string;
  addedAt: string;
};

const SEED_CREATIVES: Creative[] = [
  { id: "cr_1", title: "Summer Sale Hero", url: "https://picsum.photos/seed/nexuscr1/900/900", placement: "Instagram Feed", addedAt: "2026-06-20" },
  { id: "cr_2", title: "Lead Magnet Carousel", url: "https://picsum.photos/seed/nexuscr2/900/900", placement: "Facebook Feed", addedAt: "2026-06-22" },
  { id: "cr_3", title: "Brand Story Reel", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", placement: "Instagram Reel", addedAt: "2026-06-25" },
  { id: "cr_4", title: "Client Testimonial Story", url: "https://picsum.photos/seed/nexuscr4/900/1600", placement: "Instagram Story", addedAt: "2026-06-27" },
];

export const useCreatives = () => useLocalStore<Creative[]>("creatives", SEED_CREATIVES);
