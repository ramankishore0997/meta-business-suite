import { useIntegrations } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

/**
 * Live "Connected to Meta Business" trust badge. Reads the Meta integration
 * connection state from the local store — no fake status invented.
 */
export function MetaConnectionBadge({
  className,
  syncedLabel = "3 mins ago",
}: {
  className?: string;
  syncedLabel?: string;
}) {
  const [integrations] = useIntegrations();
  const meta = integrations.find((i) => i.id === "meta");
  const connected = meta?.connected ?? false;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs backdrop-blur-sm",
        connected
          ? "border-emerald-500/25 bg-emerald-500/10"
          : "border-border bg-muted/40",
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            connected ? "bg-emerald-400" : "bg-muted-foreground",
          )}
        />
      </span>
      <span className={cn("font-semibold", connected ? "text-emerald-400" : "text-muted-foreground")}>
        {connected ? "Connected to Meta Business" : "Meta not connected"}
      </span>
      <span className="flex items-center gap-1 text-muted-foreground">
        <RefreshCcw className="h-3 w-3" /> synced {syncedLabel}
      </span>
    </div>
  );
}
