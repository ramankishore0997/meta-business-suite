import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Megaphone,
  Layers,
  ImageIcon,
  Images,
  LayoutTemplate,
  Users,
  BarChart3,
  FileText,
  ReceiptText,
  CreditCard,
  Blocks,
  UsersRound,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalStore } from "@/lib/store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NavItem = { icon: typeof LayoutDashboard; label: string; href: string; group?: string };

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Megaphone, label: "Campaigns", href: "/campaigns" },
  { icon: Layers, label: "Ad Sets", href: "/adsets" },
  { icon: ImageIcon, label: "Ads", href: "/ads" },
  { icon: Images, label: "Creative Gallery", href: "/creatives" },
  { icon: LayoutTemplate, label: "Client Portal", href: "/portal" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: ReceiptText, label: "Invoices", href: "/invoices" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Blocks, label: "Integrations", href: "/integrations" },
  { icon: UsersRound, label: "Team", href: "/team" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function isActive(location: string, href: string) {
  if (href === "/") return location === "/";
  return location === href || location.startsWith(href + "/") || location.startsWith(href + "?");
}

export function NavSidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useLocalStore<boolean>("sidebarCollapsed", false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  function handleLogout() {
    setLogoutOpen(true);
  }

  function confirmLogout() {
    try {
      ["adAccount", "activeClientId", "theme", "metabs_access_ok"].forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.href = import.meta.env.BASE_URL || "/";
  }

  return (
    <aside
      className={cn(
        "relative z-30 flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300 ease-out",
        collapsed ? "w-[76px]" : "w-[248px]"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-[68px] items-center gap-3 px-4", collapsed && "justify-center px-0")}>
        <Link href="/">
          <div className="flex cursor-pointer items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="font-display text-[15px] font-bold tracking-tight text-foreground">Meta Business Suite</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">For Developers</span>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
        <div className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(location, item.href);
            const link = (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  {active && !collapsed && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <item.icon className={cn("h-[19px] w-[19px] shrink-0", active && "text-primary")} strokeWidth={active ? 2.4 : 2} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
              </Link>
            );
            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <PanelLeftOpen className="h-[19px] w-[19px]" /> : <PanelLeftClose className="h-[19px] w-[19px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-0"
          )}
          title="Logout"
        >
          <LogOut className="h-[19px] w-[19px]" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of Meta Business Suite?</AlertDialogTitle>
            <AlertDialogDescription>
              Your workspace and client selection will be cleared on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
