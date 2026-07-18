import { ImageIcon, ThumbsUp, MessageCircle, Share2, Globe, MoreHorizontal } from "lucide-react";
import { mediaSrc } from "@/lib/format";

const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: "Learn more",
  SHOP_NOW: "Shop now",
  SIGN_UP: "Sign up",
  SEND_MESSAGE: "Send message",
  BOOK_NOW: "Book now",
  DOWNLOAD: "Download",
  CONTACT_US: "Contact us",
  SUBSCRIBE: "Subscribe",
  GET_OFFER: "Get offer",
  APPLY_NOW: "Apply now",
};

export function AdPreview({
  pageName,
  primaryText,
  headline,
  description,
  callToAction,
  mediaUrl,
  destinationUrl,
}: {
  pageName: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: string;
  mediaUrl: string | null;
  destinationUrl: string;
}) {
  const src = mediaSrc(mediaUrl);
  const ctaLabel = callToAction
    ? (CTA_LABELS[callToAction] ?? callToAction)
    : "Learn more";
  const domain = (() => {
    if (!destinationUrl) return "your-website.com";
    try {
      return new URL(
        destinationUrl.startsWith("http")
          ? destinationUrl
          : `https://${destinationUrl}`,
      ).hostname.replace(/^www\./, "");
    } catch {
      return "your-website.com";
    }
  })();

  return (
    <div className="w-full mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-inner">
            <span className="text-sm font-bold text-white tracking-wider">
              {(pageName || "P").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-foreground">
              {pageName || "Your Page"}
            </div>
            <div className="text-[12px] text-muted-foreground flex items-center gap-1 mt-0.5">
              Sponsored <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>
        <button className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Text */}
      {primaryText && (
        <div className="px-3.5 pb-3">
          <p className="whitespace-pre-wrap text-[15px] leading-snug">{primaryText}</p>
        </div>
      )}

      {/* Media */}
      <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-muted/50 border-y border-border/50 relative overflow-hidden">
        {src ? (
          <img
            src={src}
            alt="Ad creative preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
            <ImageIcon className="h-10 w-10" strokeWidth={1.5} />
            <span className="text-[13px] font-medium">Image preview</span>
          </div>
        )}
      </div>

      {/* Link Details */}
      <div className="flex items-center justify-between gap-4 bg-muted/30 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
            {domain}
          </div>
          <div className="truncate text-base font-bold text-foreground">
            {headline || "Your headline"}
          </div>
          {description && (
            <div className="truncate text-[13px] text-muted-foreground mt-0.5">
              {description}
            </div>
          )}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg bg-muted-foreground/10 border border-border/50 px-4 py-2 text-[13px] font-bold text-foreground hover:bg-muted-foreground/20 transition-colors"
        >
          {ctaLabel}
        </button>
      </div>

      {/* Social Actions */}
      <div className="flex items-center justify-between border-t border-border/50 px-2 py-1">
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
          <ThumbsUp className="h-[18px] w-[18px]" /> Like
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
          <MessageCircle className="h-[18px] w-[18px]" /> Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">
          <Share2 className="h-[18px] w-[18px]" /> Share
        </button>
      </div>
    </div>
  );
}
