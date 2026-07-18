import { useState } from "react";
import { Layout } from "@/components/layout";
import { PageContainer, PageHeader, GlassCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, DEFAULT_SETTINGS, type AgencySettings } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Building2, Bell, Palette, RotateCcw } from "lucide-react";

const TIMEZONES = ["America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"];

export default function SettingsPage() {
  const [settings, setSettings] = useSettings();
  const { toast } = useToast();
  const [draft, setDraft] = useState<AgencySettings>(settings);

  function update<K extends keyof AgencySettings>(key: K, value: AgencySettings[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function save() {
    setSettings(draft);
    toast({ title: "Settings saved", description: "Your workspace preferences are up to date." });
  }
  function reset() {
    setDraft(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
    toast({ title: "Settings reset to defaults" });
  }

  return (
    <Layout>
      <PageContainer className="max-w-3xl">
        <PageHeader title="Settings" subtitle="Configure your agency workspace." />

        <GlassCard className="mb-5 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Agency</h3>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agency Name</Label>
              <Input value={draft.agencyName} onChange={(e) => update("agencyName", e.target.value)} className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Email</Label>
              <Input value={draft.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Currency</Label>
              <Select value={draft.currency} onValueChange={(v) => update("currency", v)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Timezone</Label>
              <Select value={draft.timezone} onValueChange={(v) => update("timezone", v)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="mb-5 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Notifications</h3>
          </div>
          <div className="divide-y divide-border/60">
            {([
              ["weeklyReports", "Weekly performance reports", "Emailed summary every Monday morning."],
              ["budgetAlerts", "Budget alerts", "Notify when a campaign exceeds spend thresholds."],
              ["lowCtrAlerts", "Low CTR alerts", "Warn when click-through rate drops below 1%."],
            ] as const).map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between py-3.5">
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={draft[key]} onCheckedChange={(v) => update(key, v)} />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="mb-5 p-6">
          <div className="mb-5 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Branding</h3>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">White-label mode</p>
              <p className="text-xs text-muted-foreground">Hide Meta Business Suite branding on client-facing reports.</p>
            </div>
            <Switch checked={draft.whiteLabel} onCheckedChange={(v) => update("whiteLabel", v)} />
          </div>
          <div className="mt-4 grid gap-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Accent Hue ({draft.accentHue}°)</Label>
            <input
              type="range"
              min={0}
              max={360}
              value={draft.accentHue}
              onChange={(e) => update("accentHue", Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full"
              style={{ background: `linear-gradient(to right, hsl(0 80% 55%), hsl(60 80% 55%), hsl(120 80% 55%), hsl(180 80% 55%), hsl(240 80% 55%), hsl(300 80% 55%), hsl(360 80% 55%))` }}
            />
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-5 w-5 rounded-md" style={{ backgroundColor: `hsl(${draft.accentHue} 80% 55%)` }} />
              Preview color
            </div>
          </div>
        </GlassCard>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={reset} className="h-10 gap-2 rounded-xl">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
          <Button onClick={save} className="h-10 rounded-xl px-8 font-semibold shadow-lg shadow-primary/25">Save Changes</Button>
        </div>
      </PageContainer>
    </Layout>
  );
}
