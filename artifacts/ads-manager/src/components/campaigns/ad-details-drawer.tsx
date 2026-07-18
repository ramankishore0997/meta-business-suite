import { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CreativePreview } from "./creative-preview";
import { useCampaignsUI } from "./context";
import { DeliveryPill } from "@/components/delivery-pill";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cpc, useAdExtrasMap, resolveAdExtras, seeded, type AdComment } from "@/lib/perf";
import { uid } from "@/lib/store";
import { cn } from "@/lib/utils";
import { X, MessageSquare, StickyNote, Activity, Link2, Send } from "lucide-react";

export function AdDetailsDrawer() {
  const { activeAd, closeAd } = useCampaignsUI();
  const [extrasMap, setExtrasMap] = useAdExtrasMap();
  const [comment, setComment] = useState("");

  const ad = activeAd;
  const extras = ad ? resolveAdExtras(ad.id, extrasMap) : { notes: "", comments: [] as AdComment[] };

  const history = useMemo(() => {
    if (!ad) return [];
    return [6, 5, 4, 3, 2, 1, 0].map((d) => ({
      day: d,
      value: Math.round(ad.amountSpent * (0.08 + seeded(ad.id, d + 30) * 0.14)),
    }));
  }, [ad]);

  if (!ad) return null;

  const maxHist = Math.max(1, ...history.map((h) => h.value));

  const addComment = () => {
    if (!comment.trim()) return;
    const c: AdComment = { id: uid("c"), author: "You", text: comment.trim(), at: new Date().toISOString() };
    setExtrasMap((prev) => {
      const cur = prev[String(ad.id)] ?? { notes: "", comments: [] };
      return { ...prev, [String(ad.id)]: { ...cur, comments: [...cur.comments, c] } };
    });
    setComment("");
  };

  const setNotes = (notes: string) => {
    setExtrasMap((prev) => {
      const cur = prev[String(ad.id)] ?? { notes: "", comments: [] };
      return { ...prev, [String(ad.id)]: { ...cur, notes } };
    });
  };

  return (
    <Sheet open={!!ad} onOpenChange={(o) => !o && closeAd()}>
      <SheetContent side="right" className="flex w-[500px] max-w-[100vw] flex-col gap-0 border-l border-border bg-card p-0 sm:max-w-[500px]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold tracking-tight">{ad.name}</div>
            <div className="text-xs text-muted-foreground">{ad.campaignName} · {ad.adsetName}</div>
          </div>
          <button onClick={closeAd} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <CreativePreview url={ad.mediaUrl} format={ad.format} className="aspect-video w-full" />

          <div className="flex items-center gap-2">
            <DeliveryPill status={ad.delivery} />
            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {ad.format}
            </span>
          </div>

          <Section title="Performance">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Spend" value={formatCurrency(ad.amountSpent)} accent />
              <Stat label="Results" value={formatNumber(ad.results)} />
              <Stat label="Cost / Result" value={formatCurrency(ad.costPerResult)} />
              <Stat label="CTR" value={`${(ad.ctr ?? 0).toFixed(2)}%`} />
              <Stat label="CPC" value={formatCurrency(cpc(ad.amountSpent, ad.clicks))} />
              <Stat label="CPM" value={formatCurrency(ad.cpm ?? 0)} />
              <Stat label="Clicks" value={formatNumber(ad.clicks)} />
              <Stat label="Impressions" value={formatNumber(ad.impressions)} />
              <Stat label="Reach" value={formatNumber(ad.reach)} />
            </div>
          </Section>

          <Section title="Performance history" icon={<Activity className="h-3.5 w-3.5" />}>
            <div className="flex h-24 items-end gap-1.5 rounded-xl border border-border bg-muted/20 p-3">
              {history.map((h) => (
                <div key={h.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary transition-all"
                    style={{ height: `${(h.value / maxHist) * 100}%` }}
                    title={formatCurrency(h.value)}
                  />
                  <span className="text-[9px] text-muted-foreground">{h.day === 0 ? "Now" : `-${h.day}d`}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Creative details">
            <div className="space-y-2.5">
              <Detail label="Headline" value={ad.headline} />
              <Detail label="Primary text" value={ad.primaryText} />
              <Detail label="Description" value={ad.description} />
              <Detail label="Call to action" value={ad.callToAction} />
              <Detail label="Destination URL" value={ad.destinationUrl} link />
              <Detail label="Landing page" value={ad.identityPage} />
            </div>
          </Section>

          {ad.destinationUrl && (
            <Section title="Tracking" icon={<Link2 className="h-3.5 w-3.5" />}>
              <div className="rounded-xl border border-border bg-muted/20 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {ad.destinationUrl}
                {!ad.destinationUrl.includes("utm_") && (
                  <span className="text-foreground/60">?utm_source=metabs&utm_medium=paid&utm_campaign={ad.campaignId}</span>
                )}
              </div>
            </Section>
          )}

          <Section title="Internal notes" icon={<StickyNote className="h-3.5 w-3.5" />}>
            <Textarea
              value={extras.notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this creative..."
              className="min-h-[70px] resize-none rounded-xl bg-muted/20 text-sm"
            />
          </Section>

          <Section title="Comments" icon={<MessageSquare className="h-3.5 w-3.5" />}>
            <div className="space-y-2">
              {extras.comments.length === 0 && (
                <p className="rounded-xl border border-dashed border-border bg-muted/10 px-3 py-4 text-center text-xs text-muted-foreground">
                  No comments yet.
                </p>
              )}
              {extras.comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addComment()}
                  placeholder="Write a comment..."
                  className="h-9 rounded-full bg-muted/20 text-sm"
                />
                <Button size="sm" className="h-9 w-9 shrink-0 rounded-full p-0" onClick={addComment}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-2.5 py-2">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 truncate font-mono text-xs font-bold", accent ? "text-primary" : "text-foreground")}>{value}</div>
    </div>
  );
}

function Detail({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-primary hover:underline">
          {value}
        </a>
      ) : (
        <span className="text-sm text-foreground">{value}</span>
      )}
    </div>
  );
}
