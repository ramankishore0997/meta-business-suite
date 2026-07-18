import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateCampaign,
  getListCampaignsQueryKey,
  useUpdateAdSet,
  getListAdSetsQueryKey,
  useUpdateAd,
  getListAdsQueryKey,
} from "@workspace/api-client-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { SpendAndCostFields } from "./dialog-fields";
import { AdPreview } from "./ad-preview";
import {
  useEntityForm,
  CampaignFields,
  AdSetFields,
  AdCreativeFields,
  emptyCampaignForm,
  emptyAdSetForm,
  emptyAdForm,
} from "./entity-forms";
import { cn } from "@/lib/utils";

type EntityType = "campaign" | "adset" | "ad";
const STEP_LABELS = { campaign: "Campaign", adset: "Ad Set", ad: "Ad Creative" };

export interface EditTarget {
  id: number;
  name: string;
  amountSpent: number;
  costPerResult?: number | null;
  // campaign
  objective?: string;
  buyingType?: string | null;
  specialCategories?: string | null;
  dailyBudget?: number | null;
  totalBudget?: number | null;
  abTestEnabled?: boolean | null;
  // adset
  budgetType?: string;
  budget?: number | null;
  conversionLocation?: string | null;
  facebookPage?: string | null;
  performanceGoal?: string | null;
  gender?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  languages?: string | null;
  location?: string | null;
  detailedTargeting?: string | null;
  audience?: string | null;
  placementMode?: string | null;
  placement?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  // ad
  format?: string;
  identityPage?: string | null;
  instagramHandle?: string | null;
  headline?: string | null;
  primaryText?: string | null;
  description?: string | null;
  callToAction?: string | null;
  destinationUrl?: string | null;
  mediaUrl?: string | null;
}

const num = (v: string): number | null => (v.trim() === "" ? null : parseFloat(v));
const nn = (v: string): string | null => (v.trim() === "" ? null : v.trim());
const numStr = (n: number | null | undefined): string =>
  n !== null && n !== undefined ? String(n) : "";

export function EditDialog({
  entity,
  target,
  onOpenChange,
}: {
  entity: EntityType;
  target: EditTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [costPerResult, setCostPerResult] = useState("");

  const campaignForm = useEntityForm({ ...emptyCampaignForm });
  const adsetForm = useEntityForm({ ...emptyAdSetForm });
  const adForm = useEntityForm({ ...emptyAdForm });

  useEffect(() => {
    if (!target) return;
    setAmount(String(target.amountSpent));
    setCostPerResult(numStr(target.costPerResult));

    if (entity === "campaign") {
      const budgetType = target.budgetType ?? "ad_set_budget";
      campaignForm.reset({
        name: target.name,
        objective: target.objective ?? "TRAFFIC",
        buyingType: target.buyingType ?? "AUCTION",
        specialCategories: target.specialCategories ?? "none",
        budgetType,
        budget:
          budgetType === "daily"
            ? numStr(target.dailyBudget)
            : budgetType === "lifetime"
              ? numStr(target.totalBudget)
              : "",
        abTestEnabled: target.abTestEnabled ?? false,
      });
    } else if (entity === "adset") {
      adsetForm.reset({
        campaignId: "",
        name: target.name,
        conversionLocation: target.conversionLocation ?? "website",
        facebookPage: target.facebookPage ?? "",
        performanceGoal: target.performanceGoal ?? "link_clicks",
        budgetType: target.budgetType ?? "daily",
        budget: numStr(target.budget),
        startDate: target.startDate ?? "",
        endDate: target.endDate ?? "",
        location: target.location ?? "",
        ageMin: numStr(target.ageMin) || "18",
        ageMax: numStr(target.ageMax) || "65",
        gender: target.gender ?? "all",
        languages: target.languages ?? "",
        detailedTargeting: target.detailedTargeting ?? "",
        audience: target.audience ?? "",
        placementMode: target.placementMode ?? "advantage_plus",
        placement: target.placement ?? "",
      });
    } else {
      adForm.reset({
        adsetId: "",
        name: target.name,
        format: target.format ?? "image",
        identityPage: target.identityPage ?? "",
        instagramHandle: target.instagramHandle ?? "",
        headline: target.headline ?? "",
        primaryText: target.primaryText ?? "",
        description: target.description ?? "",
        callToAction: target.callToAction ?? "LEARN_MORE",
        destinationUrl: target.destinationUrl ?? "",
        mediaUrl: target.mediaUrl ?? null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, entity]);

  const updateCampaign = useUpdateCampaign();
  const updateAdSet = useUpdateAdSet();
  const updateAd = useUpdateAd();
  const isPending =
    updateCampaign.isPending || updateAdSet.isPending || updateAd.isPending;

  function onSuccess(spend: number) {
    if (entity === "campaign")
      queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
    if (entity === "adset")
      queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey() });
    if (entity === "ad")
      queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
    toast({
      title: "Changes Saved",
      description: `Spend updated to ${formatCurrency(spend)}`,
    });
    onOpenChange(false);
  }

  function onError() {
    toast({
      title: "Error saving changes",
      description: "Please check your fields and try again.",
      variant: "destructive",
    });
  }

  function handleSubmit() {
    if (!target) return;
    const spend = parseFloat(amount) || 0;
    const cpr = num(costPerResult);

    if (entity === "campaign") {
      const v = campaignForm.values;
      updateCampaign.mutate(
        {
          id: target.id,
          data: {
            name: v.name.trim() || target.name,
            objective: v.objective as never,
            buyingType: v.buyingType as never,
            specialCategories:
              v.specialCategories === "none" ? null : v.specialCategories,
            budgetType: v.budgetType as never,
            dailyBudget: v.budgetType === "daily" ? num(v.budget) : null,
            totalBudget: v.budgetType === "lifetime" ? num(v.budget) : null,
            abTestEnabled: v.abTestEnabled,
            amountSpent: spend,
            costPerResult: cpr,
          },
        },
        { onSuccess: () => onSuccess(spend), onError },
      );
    } else if (entity === "adset") {
      const v = adsetForm.values;
      updateAdSet.mutate(
        {
          id: target.id,
          data: {
            name: v.name.trim() || target.name,
            budgetType: v.budgetType as never,
            budget: num(v.budget),
            startDate: nn(v.startDate) ?? undefined,
            endDate: nn(v.endDate),
            conversionLocation: v.conversionLocation,
            facebookPage: nn(v.facebookPage),
            performanceGoal: v.performanceGoal,
            gender: v.gender,
            ageMin: parseInt(v.ageMin) || 18,
            ageMax: parseInt(v.ageMax) || 65,
            languages: nn(v.languages),
            location: nn(v.location),
            detailedTargeting: nn(v.detailedTargeting),
            audience: nn(v.audience),
            placementMode: v.placementMode,
            placement: v.placementMode === "manual" ? nn(v.placement) : null,
            amountSpent: spend,
            costPerResult: cpr,
          },
        },
        { onSuccess: () => onSuccess(spend), onError },
      );
    } else {
      const v = adForm.values;
      updateAd.mutate(
        {
          id: target.id,
          data: {
            name: v.name.trim() || target.name,
            format: v.format as never,
            identityPage: nn(v.identityPage),
            instagramHandle: nn(v.instagramHandle),
            headline: nn(v.headline),
            primaryText: nn(v.primaryText),
            description: nn(v.description),
            callToAction: nn(v.callToAction),
            destinationUrl: nn(v.destinationUrl),
            mediaUrl: v.mediaUrl,
            amountSpent: spend,
            costPerResult: cpr,
          },
        },
        { onSuccess: () => onSuccess(spend), onError },
      );
    }
  }

  const isAd = entity === "ad";
  const ad = adForm.values;

  return (
    <Sheet open={target !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "p-0 flex flex-col border-l border-border/50 shadow-2xl",
          isAd ? "w-full sm:max-w-5xl" : "w-full sm:max-w-xl"
        )}
      >
        <SheetHeader className="border-b border-border/50 px-8 py-6 bg-card shrink-0">
          <SheetTitle className="text-2xl font-display font-bold text-foreground flex flex-col">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-sans font-semibold mb-1">Editing {STEP_LABELS[entity]}</span>
            {target?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 flex bg-muted/10">
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            <div className="grid gap-6 max-w-2xl">
              {entity === "campaign" && (
                <CampaignFields values={campaignForm.values} set={campaignForm.set} />
              )}
              {entity === "adset" && (
                <AdSetFields values={adsetForm.values} set={adsetForm.set} />
              )}
              {entity === "ad" && (
                <AdCreativeFields values={adForm.values} set={adForm.set} />
              )}
              <SpendAndCostFields
                amount={amount}
                onAmountChange={setAmount}
                costPerResult={costPerResult}
                onCostPerResultChange={setCostPerResult}
              />
            </div>
          </div>

          {isAd && (
            <div className="w-[400px] border-l border-border/50 bg-card p-6 flex flex-col items-center shrink-0">
              <div className="w-full sticky top-6">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Live Preview
                </p>
                <AdPreview
                  pageName={ad.identityPage}
                  primaryText={ad.primaryText}
                  headline={ad.headline}
                  description={ad.description}
                  callToAction={ad.callToAction}
                  mediaUrl={ad.mediaUrl}
                  destinationUrl={ad.destinationUrl}
                />
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-border/50 px-8 py-5 bg-card shrink-0 flex items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="rounded-full px-8 font-semibold shadow-md">
            {isPending ? "Saving changes..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
