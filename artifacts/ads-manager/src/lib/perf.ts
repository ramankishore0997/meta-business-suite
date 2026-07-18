import { useLocalStore } from "@/lib/store";
import type { Campaign, AdSet, Ad } from "@workspace/api-client-react";

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random (stable per id + salt)                  */
/* ------------------------------------------------------------------ */

export function seeded(id: number, salt = 0): number {
  const x = Math.sin(id * 97.13 + salt * 31.7 + 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/* ------------------------------------------------------------------ */
/* Derived metrics                                                     */
/* ------------------------------------------------------------------ */

export function cpc(spend: number, clicks: number): number {
  return clicks > 0 ? spend / clicks : 0;
}

export function roas(revenue: number, spend: number): number {
  return spend > 0 ? revenue / spend : 0;
}

export function cpl(spend: number, leads: number): number {
  return leads > 0 ? spend / leads : 0;
}

/** 0-100 delivery health from CTR, frequency and delivery state. */
export function healthScore(m: {
  ctr?: number | null;
  frequency?: number | null;
  delivery: string;
}): number {
  let s = 58;
  const ctr = m.ctr ?? 0;
  if (ctr > 2.5) s += 22;
  else if (ctr > 1.5) s += 14;
  else if (ctr > 0.8) s += 7;
  else if (ctr > 0) s += 2;

  const freq = m.frequency ?? 0;
  if (freq > 0 && freq < 2) s += 10;
  else if (freq >= 4) s -= 16;
  else if (freq >= 2.6) s -= 6;

  if (m.delivery === "active") s += 9;
  else if (m.delivery === "learning") s += 3;
  else if (m.delivery === "error") s -= 28;
  else s -= 12;

  return Math.round(clamp(s, 3, 99));
}

/** 0-100 performance from ROAS and CTR. */
export function performanceScore(roasVal: number, ctr: number | null | undefined): number {
  let s = 38;
  if (roasVal >= 4) s += 38;
  else if (roasVal >= 2.5) s += 27;
  else if (roasVal >= 1.5) s += 16;
  else if (roasVal >= 1) s += 8;
  else if (roasVal > 0) s += 3;

  const c = ctr ?? 0;
  if (c > 2.5) s += 22;
  else if (c > 1.5) s += 13;
  else if (c > 0.8) s += 6;
  else if (c > 0) s += 2;

  return Math.round(clamp(s, 4, 99));
}

export function scoreTone(score: number): "success" | "warning" | "danger" {
  if (score >= 70) return "success";
  if (score >= 45) return "warning";
  return "danger";
}

/* ------------------------------------------------------------------ */
/* Meta placement derivation                                           */
/* ------------------------------------------------------------------ */

export type Placement = { key: string; label: string; color: string };

/** Meta-only placements. No other ad networks exist in this product. */
export const PLACEMENTS: Placement[] = [
  { key: "facebook", label: "Facebook Feed", color: "#1877F2" },
  { key: "instagram", label: "Instagram Feed", color: "#E4405F" },
  { key: "stories", label: "Stories", color: "#C13584" },
  { key: "reels", label: "Reels", color: "#833AB4" },
  { key: "messenger", label: "Messenger", color: "#00B2FF" },
  { key: "audience", label: "Audience Network", color: "#0866FF" },
];

/** Stable 2-4 Meta placements per campaign id. */
export function placementsFor(id: number): Placement[] {
  const count = 2 + Math.floor(seeded(id, 11) * 3);
  const start = Math.floor(seeded(id, 12) * PLACEMENTS.length);
  const out: Placement[] = [];
  for (let i = 0; i < count; i++) {
    out.push(PLACEMENTS[(start + i) % PLACEMENTS.length]);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Audience distributions (stable per ad set id)                       */
/* ------------------------------------------------------------------ */

export type DistItem = { label: string; value: number };

function distribution(id: number, salt: number, labels: string[]): DistItem[] {
  const raw = labels.map((_, i) => 0.15 + seeded(id, salt + i * 3));
  const total = raw.reduce((a, b) => a + b, 0);
  return labels.map((label, i) => ({
    label,
    value: Math.round((raw[i] / total) * 100),
  }));
}

export function ageDistribution(id: number): DistItem[] {
  return distribution(id, 21, ["18-24", "25-34", "35-44", "45-54", "55+"]);
}

export function genderDistribution(id: number): DistItem[] {
  const male = 30 + Math.round(seeded(id, 41) * 40);
  return [
    { label: "Female", value: 100 - male },
    { label: "Male", value: male },
  ];
}

export function deviceDistribution(id: number): DistItem[] {
  return distribution(id, 51, ["Mobile", "Desktop", "Tablet"]);
}

export function placementDistribution(id: number): DistItem[] {
  return distribution(id, 61, ["FB Feed", "IG Feed", "Stories", "Reels", "Audience Net."]);
}

const COUNTRY_POOL = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "India", "France"];

export function countryDistribution(id: number): DistItem[] {
  const start = Math.floor(seeded(id, 71) * COUNTRY_POOL.length);
  const picks = [0, 1, 2, 3].map((i) => COUNTRY_POOL[(start + i) % COUNTRY_POOL.length]);
  return distribution(id, 73, picks).sort((a, b) => b.value - a.value);
}

export function estimatedAudience(id: number): number {
  return Math.round((0.4 + seeded(id, 81) * 4.6) * 1_000_000);
}

/* ------------------------------------------------------------------ */
/* localStorage extras (revenue / leads / purchases / tags / manager)  */
/* ------------------------------------------------------------------ */

export type CampaignExtras = {
  revenue: number;
  leads: number;
  purchases: number;
  tags: string[];
  manager: string;
  notes: string;
};

const MANAGERS = ["Jordan Diaz", "Priya Nair", "Liam Chen", "Emma Wolf"];
const TAG_POOL = [
  "Prospecting",
  "Retargeting",
  "High Intent",
  "Scaling",
  "Evergreen",
  "Seasonal",
  "Top Funnel",
  "Lookalike",
];

export function defaultManager(id: number): string {
  return MANAGERS[Math.floor(seeded(id, 7) * MANAGERS.length)];
}

export function defaultTags(id: number): string[] {
  const a = TAG_POOL[Math.floor(seeded(id, 8) * TAG_POOL.length)];
  const b = TAG_POOL[Math.floor(seeded(id, 9) * TAG_POOL.length)];
  return a === b ? [a] : [a, b];
}

/** Derive believable defaults so ROAS/CPL are populated before any edit. */
export function deriveExtraDefaults(c: Pick<Campaign, "id" | "results">): CampaignExtras {
  const aov = 24 + seeded(c.id, 1) * 96;
  return {
    revenue: Math.round(c.results * aov),
    leads: Math.round(c.results * (0.55 + seeded(c.id, 2) * 0.4)),
    purchases: Math.round(c.results * (0.2 + seeded(c.id, 3) * 0.4)),
    tags: defaultTags(c.id),
    manager: defaultManager(c.id),
    notes: "",
  };
}

export function useCampaignExtrasMap() {
  return useLocalStore<Record<string, Partial<CampaignExtras>>>("campaignExtras", {});
}

export function resolveExtras(
  c: Pick<Campaign, "id" | "results">,
  map: Record<string, Partial<CampaignExtras>>,
): CampaignExtras {
  const stored = map[String(c.id)];
  const defaults = deriveExtraDefaults(c);
  return { ...defaults, ...(stored ?? {}) };
}

/* ------------------------------------------------------------------ */
/* Ad-level notes + comments                                           */
/* ------------------------------------------------------------------ */

export type AdComment = { id: string; author: string; text: string; at: string };
export type AdExtras = { notes: string; comments: AdComment[] };

export function useAdExtrasMap() {
  return useLocalStore<Record<string, AdExtras>>("adExtras", {});
}

export function resolveAdExtras(id: number, map: Record<string, AdExtras>): AdExtras {
  return map[String(id)] ?? { notes: "", comments: [] };
}

/* ------------------------------------------------------------------ */
/* Derived social engagement (stable per ad id)                        */
/* ------------------------------------------------------------------ */

export type AdSocial = { likes: number; comments: number; shares: number; conversions: number };

export function adSocial(ad: Pick<Ad, "id" | "results" | "clicks">): AdSocial {
  const base = Math.max(ad.results, 1);
  return {
    likes: Math.round(ad.clicks * (0.35 + seeded(ad.id, 101) * 0.85)) + base,
    comments: Math.round(base * (0.12 + seeded(ad.id, 102) * 0.5)),
    shares: Math.round(base * (0.06 + seeded(ad.id, 103) * 0.3)),
    conversions: Math.max(0, Math.round(ad.results * (0.28 + seeded(ad.id, 104) * 0.5))),
  };
}

/* ------------------------------------------------------------------ */
/* Creative type detection                                             */
/* ------------------------------------------------------------------ */

export type CreativeKind = "image" | "video" | "none";

export function creativeKind(url: string | null | undefined, format?: Ad["format"]): CreativeKind {
  if (!url || !url.trim()) return "none";
  const clean = url.split("?")[0].split("#")[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv|ogg)$/.test(clean)) return "video";
  if (/\.(jpg|jpeg|png|webp|gif|avif|svg|bmp)$/.test(clean)) return "image";
  if (clean.includes("/video/")) return "video";
  if (clean.includes("/image/")) return "image";
  if (format === "video") return "video";
  return "image";
}

/* ------------------------------------------------------------------ */
/* Compact number formatting                                           */
/* ------------------------------------------------------------------ */

export function compact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(2)}%`;
}

export type { Campaign, AdSet, Ad };
