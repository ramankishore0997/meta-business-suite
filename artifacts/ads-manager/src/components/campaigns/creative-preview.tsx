import { useEffect, useState } from "react";
import { creativeKind } from "@/lib/perf";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ImageOff,
  Maximize2,
  Download,
  Copy,
  ExternalLink,
  Play,
  ZoomIn,
  ZoomOut,
  ImageIcon,
} from "lucide-react";
import type { Ad } from "@workspace/api-client-react";

function download(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = url.split("/").pop()?.split("?")[0] || "creative";
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function CreativePreview({
  url,
  format,
  className,
  showFullscreenButton = true,
}: {
  url: string | null | undefined;
  format?: Ad["format"];
  className?: string;
  showFullscreenButton?: boolean;
}) {
  const kind = creativeKind(url, format);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Reset load/error state whenever the creative source changes, so a stale
  // error from a previous URL doesn't linger on a now-valid one.
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [url]);

  if (kind === "none") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground",
          className,
        )}
      >
        <ImageIcon className="h-6 w-6 opacity-50" />
        <span className="text-[11px] font-medium">No creative</span>
      </div>
    );
  }

  if (errored) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 text-destructive",
          className,
        )}
      >
        <ImageOff className="h-6 w-6" />
        <span className="text-[11px] font-medium">Preview unavailable</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn("group/creative relative overflow-hidden rounded-xl border border-border bg-black/40", className)}>
        {!loaded && kind === "image" && (
          <div className="absolute inset-0 animate-pulse bg-muted/40" />
        )}

        {kind === "image" ? (
          <img
            src={url!}
            alt="Ad creative"
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover/creative:scale-[1.04]",
              !loaded && "opacity-0",
            )}
          />
        ) : (
          <video
            src={url!}
            controls
            preload="metadata"
            onError={() => setErrored(true)}
            className="h-full w-full object-cover"
          />
        )}

        {kind === "video" && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            <Play className="mr-1 inline h-2.5 w-2.5" />
            Video
          </div>
        )}

        {showFullscreenButton && (
          <button
            onClick={() => setOpen(true)}
            title="Open fullscreen"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/80 group-hover/creative:opacity-100"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <FullscreenModal
        open={open}
        onOpenChange={setOpen}
        url={url!}
        kind={kind}
        onCopy={() => {
          navigator.clipboard?.writeText(url!);
          toast({ title: "Creative URL copied" });
        }}
        onDownload={() => download(url!)}
      />
    </>
  );
}

function FullscreenModal({
  open,
  onOpenChange,
  url,
  kind,
  onCopy,
  onDownload,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  url: string;
  kind: "image" | "video";
  onCopy: () => void;
  onDownload: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-border bg-card/95 p-0 backdrop-blur-xl">
        <div className="flex max-h-[78vh] items-center justify-center overflow-auto bg-black/60 p-4">
          {kind === "image" ? (
            <img
              src={url}
              alt="Ad creative"
              onClick={() => setZoomed((z) => !z)}
              className={cn(
                "mx-auto rounded-lg transition-transform duration-300",
                zoomed ? "scale-150 cursor-zoom-out" : "max-h-[70vh] cursor-zoom-in object-contain",
              )}
            />
          ) : (
            <video src={url} controls autoPlay className="max-h-[70vh] rounded-lg" />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <span className="max-w-[45%] truncate font-mono text-xs text-muted-foreground">{url}</span>
          <div className="flex items-center gap-2">
            {kind === "image" && (
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setZoomed((z) => !z)}>
                {zoomed ? <ZoomOut className="mr-1.5 h-3.5 w-3.5" /> : <ZoomIn className="mr-1.5 h-3.5 w-3.5" />}
                {zoomed ? "Reset" : "Zoom"}
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-full" onClick={onCopy}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copy URL
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={onDownload}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
            <Button size="sm" className="rounded-full" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
