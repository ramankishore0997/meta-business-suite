import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormSection, Field, MoneyInput } from "./dialog-fields";
import {
  OBJECTIVES,
  FORMATS,
  BUYING_TYPES,
  SPECIAL_CATEGORIES,
  CONVERSION_LOCATIONS,
  PERFORMANCE_GOALS,
  GENDERS,
  PLACEMENT_MODES,
  CTA_OPTIONS,
  humanizeObjective,
} from "@/lib/meta-options";

export function useEntityForm<T extends object>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const set = useCallback(
    (patch: Partial<T>) => setValues((v) => ({ ...v, ...patch })),
    [],
  );
  const reset = useCallback((next: T) => setValues(next), []);
  return { values, set, reset };
}

// ── Campaign ──────────────────────────────────────────────────────
export interface CampaignFormValues {
  name: string;
  objective: string;
  buyingType: string;
  specialCategories: string;
  budgetType: string;
  budget: string;
  abTestEnabled: boolean;
}

export const emptyCampaignForm: CampaignFormValues = {
  name: "",
  objective: "TRAFFIC",
  buyingType: "AUCTION",
  specialCategories: "none",
  budgetType: "ad_set_budget",
  budget: "",
  abTestEnabled: false,
};

export function CampaignFields({
  values: v,
  set,
}: {
  values: CampaignFormValues;
  set: (patch: Partial<CampaignFormValues>) => void;
}) {
  return (
    <>
      <FormSection title="Campaign Settings" description="Define the core objective and structure of your campaign.">
        <Field label="Campaign Name" htmlFor="c-name">
          <Input
            id="c-name"
            className="h-11 bg-muted/30 focus-visible:bg-transparent text-base"
            placeholder="e.g. Q4 Performance Max"
            value={v.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Buying Type">
            <Select value={v.buyingType} onValueChange={(x) => set({ buyingType: x })}>
              <SelectTrigger className="h-11 bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUYING_TYPES.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Campaign Objective">
            <Select value={v.objective} onValueChange={(x) => set({ objective: x })}>
              <SelectTrigger className="h-11 bg-muted/30 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECTIVES.map((o) => (
                  <SelectItem key={o} value={o} className="font-medium">{humanizeObjective(o)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Special Ad Categories">
          <Select value={v.specialCategories} onValueChange={(x) => set({ specialCategories: x })}>
            <SelectTrigger className="h-11 bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPECIAL_CATEGORIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/10 p-4 transition-colors hover:bg-muted/20">
          <div>
            <p className="text-sm font-bold text-foreground">A/B Testing</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
              Create variations to determine the most effective strategy.
            </p>
          </div>
          <Switch
            checked={v.abTestEnabled}
            onCheckedChange={(x) => set({ abTestEnabled: x })}
          />
        </div>
      </FormSection>

      <FormSection title="Budget Optimization" description="Control how your spend is distributed.">
        <Field label="Budget Strategy">
          <Select value={v.budgetType} onValueChange={(x) => set({ budgetType: x })}>
            <SelectTrigger className="h-11 bg-muted/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ad_set_budget">Manage at Ad Set level</SelectItem>
              <SelectItem value="daily">Campaign Daily budget</SelectItem>
              <SelectItem value="lifetime">Campaign Lifetime budget</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {v.budgetType !== "ad_set_budget" && (
          <Field label={v.budgetType === "daily" ? "Daily Budget" : "Lifetime Budget"} htmlFor="c-budget">
            <MoneyInput id="c-budget" value={v.budget} onChange={(x) => set({ budget: x })} />
          </Field>
        )}
      </FormSection>
    </>
  );
}

// ── Ad Set ────────────────────────────────────────────────────────
export interface AdSetFormValues {
  campaignId: string;
  name: string;
  conversionLocation: string;
  facebookPage: string;
  performanceGoal: string;
  budgetType: string;
  budget: string;
  startDate: string;
  endDate: string;
  location: string;
  ageMin: string;
  ageMax: string;
  gender: string;
  languages: string;
  detailedTargeting: string;
  audience: string;
  placementMode: string;
  placement: string;
}

export const emptyAdSetForm: AdSetFormValues = {
  campaignId: "",
  name: "",
  conversionLocation: "website",
  facebookPage: "",
  performanceGoal: "link_clicks",
  budgetType: "daily",
  budget: "",
  startDate: "",
  endDate: "",
  location: "",
  ageMin: "18",
  ageMax: "65",
  gender: "all",
  languages: "",
  detailedTargeting: "",
  audience: "",
  placementMode: "advantage_plus",
  placement: "",
};

export function AdSetFields({
  values: v,
  set,
  campaigns,
  showCampaignSelect = false,
}: {
  values: AdSetFormValues;
  set: (patch: Partial<AdSetFormValues>) => void;
  campaigns?: { id: number; name: string }[];
  showCampaignSelect?: boolean;
}) {
  return (
    <>
      <FormSection title="Conversion Details">
        {showCampaignSelect && (
          <Field label="Parent Campaign">
            <Select value={v.campaignId} onValueChange={(x) => set({ campaignId: x })}>
              <SelectTrigger className="h-11 font-semibold border-primary/20 bg-primary/5">
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {(campaigns ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="font-medium">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field label="Ad Set Name" htmlFor="as-name">
          <Input
            id="as-name"
            className="h-11 bg-muted/30 focus-visible:bg-transparent text-base"
            placeholder="e.g. US Core Demographic"
            value={v.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </Field>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Conversion Location">
            <Select value={v.conversionLocation} onValueChange={(x) => set({ conversionLocation: x })}>
              <SelectTrigger className="h-11 bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONVERSION_LOCATIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Performance Goal">
            <Select value={v.performanceGoal} onValueChange={(x) => set({ performanceGoal: x })}>
              <SelectTrigger className="h-11 bg-muted/30 font-medium text-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERFORMANCE_GOALS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        
        <Field label="Facebook Page" htmlFor="as-fbpage">
          <Input id="as-fbpage" className="h-11 bg-muted/30" placeholder="e.g. Meta Store" value={v.facebookPage} onChange={(e) => set({ facebookPage: e.target.value })} />
        </Field>
      </FormSection>

      <FormSection title="Budget & Schedule">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Budget Type">
            <Select value={v.budgetType} onValueChange={(x) => set({ budgetType: x })}>
              <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily budget</SelectItem>
                <SelectItem value="lifetime">Lifetime budget</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Budget Amount" htmlFor="as-budget">
            <MoneyInput id="as-budget" value={v.budget} onChange={(x) => set({ budget: x })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Start Date" htmlFor="as-start">
            <Input id="as-start" className="h-11 bg-muted/30 font-mono" type="date" value={v.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </Field>
          <Field label="End Date (Optional)" htmlFor="as-end">
            <Input id="as-end" className="h-11 bg-muted/30 font-mono" type="date" value={v.endDate} onChange={(e) => set({ endDate: e.target.value })} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Audience Targeting">
        <Field label="Locations" htmlFor="as-location">
          <Input id="as-location" className="h-11 bg-muted/30" placeholder="e.g. United States, United Kingdom" value={v.location} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        
        <div className="grid grid-cols-3 gap-5">
          <Field label="Min Age" htmlFor="as-agemin">
            <Input id="as-agemin" className="h-11 bg-muted/30 font-mono" type="number" min="13" max="65" value={v.ageMin} onChange={(e) => set({ ageMin: e.target.value })} />
          </Field>
          <Field label="Max Age" htmlFor="as-agemax">
            <Input id="as-agemax" className="h-11 bg-muted/30 font-mono" type="number" min="13" max="65" value={v.ageMax} onChange={(e) => set({ ageMax: e.target.value })} />
          </Field>
          <Field label="Gender">
            <Select value={v.gender} onValueChange={(x) => set({ gender: x })}>
              <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (<SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        
        <Field label="Detailed Targeting" htmlFor="as-detailed">
          <Textarea id="as-detailed" className="min-h-[100px] bg-muted/30 resize-y leading-relaxed" placeholder="Include demographics, interests and behaviors..." value={v.detailedTargeting} onChange={(e) => set({ detailedTargeting: e.target.value })} />
        </Field>
      </FormSection>

      <FormSection title="Placements">
        <Field label="Placement Strategy">
          <Select value={v.placementMode} onValueChange={(x) => set({ placementMode: x })}>
            <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLACEMENT_MODES.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </Field>
        {v.placementMode === "manual" && (
          <Field label="Manual Placements" htmlFor="as-placement">
            <Input id="as-placement" className="h-11 bg-muted/30" placeholder="e.g. Facebook Feed, Instagram Stories" value={v.placement} onChange={(e) => set({ placement: e.target.value })} />
          </Field>
        )}
      </FormSection>
    </>
  );
}

// ── Ad ────────────────────────────────────────────────────────────
export interface AdFormValues {
  adsetId: string;
  name: string;
  format: string;
  identityPage: string;
  instagramHandle: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  destinationUrl: string;
  mediaUrl: string | null;
}

export const emptyAdForm: AdFormValues = {
  adsetId: "",
  name: "",
  format: "image",
  identityPage: "",
  instagramHandle: "",
  headline: "",
  primaryText: "",
  description: "",
  callToAction: "LEARN_MORE",
  destinationUrl: "",
  mediaUrl: null,
};

export function AdCreativeFields({
  values: v,
  set,
  adsets,
  showAdSetSelect = false,
}: {
  values: AdFormValues;
  set: (patch: Partial<AdFormValues>) => void;
  adsets?: { id: number; name: string; campaignName: string }[];
  showAdSetSelect?: boolean;
}) {
  return (
    <>
      <FormSection title="Ad Settings">
        {showAdSetSelect && (
          <Field label="Parent Ad Set">
            <Select value={v.adsetId} onValueChange={(x) => set({ adsetId: x })}>
              <SelectTrigger className="h-11 font-semibold border-primary/20 bg-primary/5">
                <SelectValue placeholder="Select an ad set" />
              </SelectTrigger>
              <SelectContent>
                {(adsets ?? []).map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <span className="font-bold">{a.name}</span> <span className="text-muted-foreground ml-1">· {a.campaignName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field label="Ad Name" htmlFor="ad-name">
          <Input id="ad-name" className="h-11 bg-muted/30 focus-visible:bg-transparent text-base" placeholder="e.g. Summer Image Creative V1" value={v.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
      </FormSection>

      <FormSection title="Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Facebook Page" htmlFor="ad-identity">
            <Input id="ad-identity" className="h-11 bg-muted/30" placeholder="e.g. Meta Business Suite" value={v.identityPage} onChange={(e) => set({ identityPage: e.target.value })} />
          </Field>
          <Field label="Instagram Account" htmlFor="ad-ig">
            <Input id="ad-ig" className="h-11 bg-muted/30" placeholder="e.g. @metabsdev" value={v.instagramHandle} onChange={(e) => set({ instagramHandle: e.target.value })} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Creative Asset">
        <Field label="Format">
          <Select value={v.format} onValueChange={(x) => set({ format: x })}>
            <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Image URL">
          <Input 
            id="ad-mediaUrl" 
            className="h-11 bg-muted/30" 
            placeholder="https://images.unsplash.com/..." 
            value={v.mediaUrl || ""} 
            onChange={(e) => set({ mediaUrl: e.target.value || null })} 
          />
        </Field>
      </FormSection>
      
      <FormSection title="Copy & Destination">
        <Field label="Primary Text" htmlFor="ad-primary">
          <Textarea id="ad-primary" className="min-h-[100px] bg-muted/30 leading-relaxed text-base" placeholder="Main ad copy shown above the image..." value={v.primaryText} onChange={(e) => set({ primaryText: e.target.value })} />
        </Field>
        <Field label="Headline" htmlFor="ad-headline">
          <Input id="ad-headline" className="h-11 bg-muted/30 font-bold" placeholder="Short, catchy headline" value={v.headline} onChange={(e) => set({ headline: e.target.value })} />
        </Field>
        <Field label="Description (Optional)" htmlFor="ad-desc">
          <Input id="ad-desc" className="h-11 bg-muted/30" placeholder="Extra context below headline" value={v.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          <Field label="Call To Action">
            <Select value={v.callToAction} onValueChange={(x) => set({ callToAction: x })}>
              <SelectTrigger className="h-11 bg-muted/30 font-bold text-primary"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CTA_OPTIONS.map((c) => (<SelectItem key={c.value} value={c.value} className="font-bold text-primary">{c.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Website URL" htmlFor="ad-dest">
            <Input id="ad-dest" className="h-11 bg-muted/30 text-blue-600 dark:text-blue-400 font-mono text-sm" placeholder="https://..." value={v.destinationUrl} onChange={(e) => set({ destinationUrl: e.target.value })} />
          </Field>
        </div>
      </FormSection>
    </>
  );
}
