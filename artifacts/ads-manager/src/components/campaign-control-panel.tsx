import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateCampaign } from "@workspace/api-client-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Campaign } from "@workspace/api-client-react";

export function CampaignControlPanel({
  campaign,
  onClose
}: {
  campaign: Campaign | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateCampaign = useUpdateCampaign();

  const [amountSpent, setAmountSpent] = useState<string>(
    campaign ? String(campaign.amountSpent) : "0"
  );
  const [cpr, setCpr] = useState<string>(
    campaign && campaign.costPerResult ? String(campaign.costPerResult) : ""
  );
  
  // Local storage for days
  const [days, setDays] = useState<string>(() => {
    return localStorage.getItem(`campaignDays_${campaign?.id}`) || "30";
  });

  if (!campaign) return null;

  const currentSpend = parseFloat(amountSpent) || 0;
  const currentCpr = parseFloat(cpr) || 0;
  const currentDays = parseInt(days) || 1;

  const dailyBudget = currentSpend / currentDays;
  const projectedResults = currentCpr > 0 ? dailyBudget / currentCpr : 0;
  const totalResults = currentCpr > 0 ? currentSpend / currentCpr : 0;

  const handleSave = () => {
    localStorage.setItem(`campaignDays_${campaign.id}`, days);
    
    updateCampaign.mutate(
      {
        id: campaign.id,
        data: {
          amountSpent: currentSpend,
          costPerResult: currentCpr > 0 ? currentCpr : null
        }
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries();
          toast({ title: "Campaign Controls Saved", description: `Updated metrics for ${campaign.name}` });
          // Update local state to match generated server data
          setAmountSpent(String(data.amountSpent));
          setCpr(data.costPerResult ? String(data.costPerResult) : "");
        },
        onError: () => {
          toast({ title: "Failed to save", variant: "destructive" });
        }
      }
    );
  };

  return (
    <Sheet open={!!campaign} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[450px] p-0 flex flex-col border-l border-border bg-card shadow-2xl">
        <SheetHeader className="px-6 py-5 border-b border-border bg-muted/10">
          <SheetTitle className="text-xl tracking-tight">Campaign Controls</SheetTitle>
          <SheetDescription className="text-xs">{campaign.name}</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          <div className="space-y-4 bg-primary/5 border border-primary/20 p-5 rounded-xl">
            <div>
              <Label className="text-xs uppercase tracking-wider font-semibold text-primary">Amount Spent ($ USD)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input 
                  type="number" 
                  value={amountSpent}
                  onChange={(e) => setAmountSpent(e.target.value)}
                  className="font-mono text-lg font-bold bg-background h-12 w-1/2"
                />
              </div>
              <div className="mt-4 px-2">
                <Slider 
                  min={0} max={100000} step={100} 
                  value={[currentSpend]} 
                  onValueChange={([v]) => setAmountSpent(String(v))} 
                  className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-primary/10">
              <Label className="text-xs uppercase tracking-wider font-semibold text-primary">Cost per Result ($ USD)</Label>
              <Input 
                type="number" 
                value={cpr}
                onChange={(e) => setCpr(e.target.value)}
                placeholder="Auto"
                className="font-mono text-lg font-bold bg-background h-12 mt-2"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Show budget over N days</Label>
            <Input 
              type="number" 
              min={1} 
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="bg-muted/30 h-10 w-full"
            />
            <div className="text-sm font-medium text-muted-foreground bg-muted/20 p-3 rounded-lg flex items-center justify-between">
              <span>Daily Budget</span>
              <span className="font-mono font-bold text-foreground">{formatCurrency(dailyBudget)}/day</span>
            </div>
            <div className="text-sm font-medium text-muted-foreground bg-muted/20 p-3 rounded-lg flex items-center justify-between">
              <span>Proj. Results/Day</span>
              <span className="font-mono font-bold text-foreground">{formatNumber(projectedResults)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Live Metrics Preview</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Results</div>
                <div className="text-xl font-bold font-mono">{formatNumber(totalResults)}</div>
              </div>
              <div className="bg-card border border-border p-3 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Spend</div>
                <div className="text-xl font-bold font-mono text-primary">{formatCurrency(currentSpend)}</div>
              </div>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="font-semibold shadow-md px-6">Apply Controls</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
