import {
  Eye,
  MousePointerClick,
  Heart,
  UserPlus,
  ShoppingBag,
  Smartphone,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ObjectiveMeta = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind text + bg + border classes for the badge. */
  className: string;
  dot: string;
  tooltip: string;
};

export const OBJECTIVE_META: Record<string, ObjectiveMeta> = {
  AWARENESS: {
    key: "AWARENESS",
    label: "Awareness",
    icon: Eye,
    className: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    dot: "bg-sky-400",
    tooltip: "Show your ads to people most likely to remember them.",
  },
  TRAFFIC: {
    key: "TRAFFIC",
    label: "Traffic",
    icon: MousePointerClick,
    className: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    dot: "bg-blue-400",
    tooltip: "Send people to a destination like your website or app.",
  },
  ENGAGEMENT: {
    key: "ENGAGEMENT",
    label: "Engagement",
    icon: Heart,
    className: "text-pink-400 bg-pink-500/10 border-pink-500/25",
    dot: "bg-pink-400",
    tooltip: "Get more messages, purchases, likes or event responses.",
  },
  LEADS: {
    key: "LEADS",
    label: "Leads",
    icon: UserPlus,
    className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    dot: "bg-emerald-400",
    tooltip: "Collect leads for your business through forms or messages.",
  },
  SALES: {
    key: "SALES",
    label: "Sales",
    icon: ShoppingBag,
    className: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    dot: "bg-violet-400",
    tooltip: "Find people likely to purchase your product or service.",
  },
  APP_PROMOTION: {
    key: "APP_PROMOTION",
    label: "App Promotion",
    icon: Smartphone,
    className: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    dot: "bg-amber-400",
    tooltip: "Get more installs and engagement for your mobile app.",
  },
  MESSAGES: {
    key: "MESSAGES",
    label: "Messages",
    icon: MessageCircle,
    className: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    dot: "bg-cyan-400",
    tooltip: "Drive conversations in Messenger, Instagram and WhatsApp.",
  },
};

export const OBJECTIVE_KEYS = Object.keys(OBJECTIVE_META);

export function objectiveMeta(key: string): ObjectiveMeta {
  return (
    OBJECTIVE_META[key] ?? {
      key,
      label: key,
      icon: Eye,
      className: "text-muted-foreground bg-muted/40 border-border",
      dot: "bg-muted-foreground",
      tooltip: key,
    }
  );
}

export function ObjectiveBadge({ objective, size = "sm" }: { objective: string; size?: "sm" | "md" }) {
  const m = objectiveMeta(objective);
  const Icon = m.icon;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider",
              m.className,
              size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
            )}
          >
            <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {m.label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">{m.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
