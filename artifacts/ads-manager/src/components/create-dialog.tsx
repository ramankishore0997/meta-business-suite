import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCampaign,
  getListCampaignsQueryKey,
  useListCampaigns,
  useCreateAdSet,
  getListAdSetsQueryKey,
  useListAdSets,
  useCreateAd,
  getListAdsQueryKey,
} from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { SpendAndCostFields } from "./dialog-fields";
import { AdPreview } from "./ad-preview";
import { CheckCircle2, ChevronRight } from "lucide-react";
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

const STEP_ORDER: EntityType[] = ["campaign", "adset", "ad"];
const STEP_LABELS = { campaign: "Campaign", adset: "Ad Set", ad: "Ad Creative" };

function useEntityType(): EntityType {
  const [location] = useLocation();
  if (location.startsWith("/adsets")) return "adset";
  if (location.startsWith("/ads")) return "ad";
  return "campaign";
}

const num = (v: string): number | null => (v.trim() === "" ? null : parseFloat(v));
const nn = (v: string): string | null => (v.trim() === "" ? null : v.trim());

export function CreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const entity = useEntityType();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns = [] } = useListCampaigns(
    {},
    {
      query: {
        queryKey: getListCampaignsQueryKey(),
        enabled: open,
      },
    },
  );
  const { data: adsets = [] } = useListAdSets(
    {},
    {
      query: {
        queryKey: getListAdSetsQueryKey(),
        enabled: open,
      },
    },
  );

  const [step, setStep] = useState<EntityType>(entity);
  const [amount, setAmount] = useState("");
  const [costPerResult, setCostPerResult] = useState("");

  const campaignForm = useEntityForm({ ...emptyCampaignForm });
  const adsetForm = useEntityForm({ ...emptyAdSetForm });
  const adForm = useEntityForm({ ...emptyAdForm });

  useEffect(() => {
    if (open) setStep(entity);
  }, [open, entity]);

  function reset() {
    setStep(entity);
    setAmount("");
    setCostPerResult("");
    campaignForm.reset({ ...emptyCampaignForm });
    adsetForm.reset({ ...emptyAdSetForm });
    adForm.reset({ ...emptyAdForm });
  }

  function closeDialog() {
    reset();
    onOpenChange(false);
  }

  const createCampaign = useCreateCampaign();
  const createAdSet = useCreateAdSet();
  const createAd = useCreateAd();
  const isPending = createCampaign.isPending || createAdSet.isPending || createAd.isPending;

  function stepToast(kind: string, spend: number) {
    toast({
      title: `${kind} created`,
      description:
        spend > 0
          ? `${formatCurrency(spend)} spend recorded.`
          : "Created as a paused draft.",
    });
  }

  function onError() {
    toast({
      title: "Error creating entity",
      description: "Please check your fields and try again.",
      variant: "destructive",
    });
  }

  function handleSubmit() {
    const spend = parseFloat(amount) || 0;
    const cpr = num(costPerResult);

    if (step === "campaign") {
      const v = campaignForm.values;
      if (!v.name.trim()) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
      }
      createCampaign.mutate(
        {
          data: {
            name: v.name.trim(),
            objective: v.objective as never,
            buyingType: v.buyingType as never,
            specialCategories: v.specialCategories === "none" ? null : v.specialCategories,
            budgetType: v.budgetType as never,
            dailyBudget: v.budgetType === "daily" ? num(v.budget) : null,
            totalBudget: v.budgetType === "lifetime" ? num(v.budget) : null,
            abTestEnabled: v.abTestEnabled,
            amountSpent: spend,
            costPerResult: cpr,
          },
        },
        {
          onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
            stepToast("Campaign", spend);
            adsetForm.set({ campaignId: String(created.id) });
            setAmount("");
            setCostPerResult("");
            setStep("adset");
          },
          onError,
        },
      );
    } else if (step === "adset") {
      const v = adsetForm.values;
      if (!v.campaignId) {
        toast({ title: "Select a campaign", variant: "destructive" });
        return;
      }
      if (!v.name.trim()) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
      }
      createAdSet.mutate(
        {
          data: {
            campaignId: parseInt(v.campaignId),
            name: v.name.trim(),
            budgetType: v.budgetType as never,
            budget: num(v.budget),
            startDate: nn(v.startDate),
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
            placement: nn(v.placement),
            amountSpent: spend,
            costPerResult: cpr,
          },
        },
        {
          onSuccess: (created) => {
            queryClient.invalidateQueries({ queryKey: getListAdSetsQueryKey() });
            stepToast("Ad set", spend);
            adForm.set({ adsetId: String(created.id) });
            setAmount("");
            setCostPerResult("");
            setStep("ad");
          },
          onError,
        },
      );
    } else {
      const v = adForm.values;
      if (!v.adsetId) {
        toast({ title: "Select an ad set", variant: "destructive" });
        return;
      }
      if (!v.name.trim()) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
      }
      createAd.mutate(
        {
          data: {
            adsetId: parseInt(v.adsetId),
            name: v.name.trim(),
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
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdsQueryKey() });
            stepToast("Ad", spend);
            closeDialog();
          },
          onError,
        },
      );
    }
  }

  const isAd = step === "ad";
  const ad = adForm.values;
  const flow = STEP_ORDER.slice(STEP_ORDER.indexOf(entity));
  const isLastStep = step === "ad";

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : closeDialog())}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 overflow-hidden border-none shadow-2xl rounded-2xl transition-all duration-300",
          isAd ? "max-w-5xl h-[85vh]" : "max-w-3xl h-[85vh]"
        )}
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-border/50 px-8 py-5 bg-card shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Create New {STEP_LABELS[entity]}</DialogTitle>
                <DialogDescription className="mt-1">
                  Guided setup process to launch your ad campaigns efficiently.
                </DialogDescription>
              </div>
            </div>
            
            {/* Stepper */}
            {flow.length > 1 && (
              <div className="flex items-center gap-2 mt-6">
                {flow.map((s, i) => {
                  const isActive = step === s;
                  const isPast = flow.indexOf(step) > i;
                  return (
                    <div key={s} className="flex items-center">
                      <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
                        isActive ? "bg-primary text-primary-foreground" : 
                        isPast ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                        {STEP_LABELS[s]}
                      </div>
                      {i < flow.length - 1 && (
                        <div className={cn("w-8 h-px mx-2", isPast ? "bg-primary" : "bg-border")} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 min-h-0 flex bg-muted/10">
            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
              <div className="grid gap-6 max-w-2xl">
                {step === "campaign" && (
                  <CampaignFields values={campaignForm.values} set={campaignForm.set} />
                )}

                {step === "adset" && (
                  <AdSetFields
                    values={adsetForm.values}
                    set={adsetForm.set}
                    campaigns={campaigns}
                    showCampaignSelect
                  />
                )}

                {step === "ad" && (
                  <AdCreativeFields
                    values={adForm.values}
                    set={adForm.set}
                    adsets={adsets}
                    showAdSetSelect
                  />
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
              <div className="w-[400px] border-l border-border/50 bg-card p-6 flex flex-col items-center justify-center shrink-0">
                <div className="w-full">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                    Ad Preview
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

          <DialogFooter className="border-t border-border/50 px-8 py-4 bg-card shrink-0 flex items-center justify-between sm:justify-between">
            <Button variant="ghost" onClick={closeDialog} disabled={isPending} className="rounded-full">
              Cancel
            </Button>
            <Button
              className="rounded-full px-8 font-semibold shadow-md"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isLastStep
                ? isPending
                  ? "Publishing..."
                  : "Publish Ad"
                : isPending
                  ? "Saving..."
                  : "Next Step"}
              {!isLastStep && !isPending && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
