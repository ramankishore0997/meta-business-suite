import { useMemo, useState } from "react";
import { Layout } from "@/components/layout";
import { PageContainer, PageHeader, GlassCard } from "@/components/shared";
import { useListAds, getListAdsQueryKey } from "@workspace/api-client-react";
import { useCreatives, uid, type Creative } from "@/lib/store";
import { creativeKind, type CreativeKind } from "@/lib/perf";
import { mediaSrc } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Play,
  ImageIcon,
  ExternalLink,
  Copy,
  Download,
  X,
  ZoomIn,
  Trash2,
  Film,
  Sparkles,
} from "lucide-react";

type GalleryItem = {
  id: string;
  title: string;
  url: string;
  kind: CreativeKind;
  placement: string;
  source: "ad" | "custom";
  sub?: string;
};

export default function CreativeGalleryPage() {
  const { data: ads = [] } = useListAds({}, { query: { queryKey: getListAdsQueryKey() } });
  const [creatives, setCreatives] = useCreatives();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [placement, setPlacement] = useState("Instagram Feed");
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [zoom, setZoom] = useState(false);

  const items = useMemo<GalleryItem[]>(() => {
    const fromAds: GalleryItem[] = ads
      .filter((a) => a.mediaUrl && a.mediaUrl.trim())
      .map((a) => ({
        id: `ad-${a.id}`,
        title: a.name,
        url: a.mediaUrl as string,
        kind: creativeKind(a.mediaUrl, a.format),
        placement: a.format,
        source: "ad" as const,
        sub: a.campaignName,
      }));
    const fromStore: GalleryItem[] = creatives.map((c) => ({
      id: `cr-${c.id}`,
      title: c.title,
      url: c.url,
      kind: creativeKind(c.url),
      placement: c.placement,
      source: "custom" as const,
    }));
    return [...fromStore, ...fromAds];
  }, [ads, creatives]);

  function addCreative() {
    if (!url.trim()) {
      toast({ title: "Paste a creative URL", description: "Add an image or video link to preview it." });
      return;
    }
    const entry: Creative = {
      id: uid("cr"),
      title: title.trim() || "Untitled Creative",
      url: url.trim(),
      placement,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    setCreatives((prev) => [entry, ...prev]);
    setTitle("");
    setUrl("");
    toast({ title: "Creative added", description: "It is now live in your gallery." });
  }

  function removeCreative(item: GalleryItem) {
    if (item.source !== "custom") return;
    const rawId = item.id.replace("cr-", "");
    setCreatives((prev) => prev.filter((c) => c.id !== rawId));
    if (active?.id === item.id) setActive(null);
  }

  function copyUrl(u: string) {
    if (!navigator.clipboard) {
      toast({ title: "Copy failed", description: "Clipboard is not available in this browser." });
      return;
    }
    navigator.clipboard.writeText(u).then(
      () => toast({ title: "URL copied", description: "Creative link copied to clipboard." }),
      () => toast({ title: "Copy failed", description: "Could not access the clipboard." }),
    );
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Creative Gallery"
          subtitle="Every live ad creative running across your campaigns — real proof for your clients."
        />

        {/* Add creative */}
        <GlassCard className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="grid flex-1 gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Creative title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Sale Hero" className="h-10" />
            </div>
            <div className="grid flex-[2] gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Paste image or video URL</label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… .jpg .png .webp .mp4 .webm" className="h-10 font-mono text-xs" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Placement</label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["Instagram Feed", "Facebook Feed", "Instagram Story", "Instagram Reel", "Messenger", "Audience Network"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <Button onClick={addCreative} className="h-10 gap-1.5 rounded-xl font-semibold">
              <Plus className="h-4 w-4" strokeWidth={3} /> Add
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Links only — image and video type is detected automatically. Nothing is uploaded.
          </p>
        </GlassCard>

        {/* Grid */}
        {items.length === 0 ? (
          <EmptyGallery />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card/40 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 duration-500 animate-in fade-in fill-mode-both"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <button
                  onClick={() => { setActive(item); setZoom(false); }}
                  className="relative block aspect-square w-full overflow-hidden bg-muted/40"
                >
                  <Thumb item={item} />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </span>
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                    {item.kind === "video" ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                    {item.kind}
                  </span>
                </button>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.placement}{item.sub ? ` · ${item.sub}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm duration-200 animate-in fade-in"
          onClick={() => setActive(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{active.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{active.placement}{active.sub ? ` · ${active.sub}` : ""}</p>
              </div>
              <div className="flex items-center gap-1">
                {active.kind === "image" && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Zoom" onClick={() => setZoom((z) => !z)}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                )}
                <a href={active.url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Open in new tab">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Copy URL" onClick={() => copyUrl(active.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={active.url} download target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
                {active.source === "custom" && (
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-destructive" title="Delete" onClick={() => removeCreative(active)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" title="Close" onClick={() => setActive(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-black/40 p-2">
              {active.kind === "video" ? (
                <video src={mediaSrc(active.url)} controls autoPlay className="max-h-[70vh] w-auto rounded-lg" />
              ) : (
                <img
                  src={mediaSrc(active.url)}
                  alt={active.title}
                  className={`rounded-lg transition-transform duration-300 ${zoom ? "max-h-none w-full cursor-zoom-out" : "max-h-[70vh] w-auto cursor-zoom-in"}`}
                  onClick={() => setZoom((z) => !z)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Thumb({ item }: { item: GalleryItem }) {
  const src = mediaSrc(item.url);
  if (item.kind === "video") {
    return (
      <div className="relative h-full w-full">
        <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
            <Play className="h-5 w-5" fill="currentColor" />
          </span>
        </span>
      </div>
    );
  }
  return <img src={src} alt={item.title} loading="lazy" className="h-full w-full object-cover" />;
}

function EmptyGallery() {
  return (
    <GlassCard className="mt-4 flex flex-col items-center justify-center gap-3 p-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <div>
        <p className="text-base font-semibold text-foreground">Showcase your first creative</p>
        <p className="mt-1 text-sm text-muted-foreground">Paste an image or video URL above — your clients will see the real ads running in their campaigns.</p>
      </div>
    </GlassCard>
  );
}
