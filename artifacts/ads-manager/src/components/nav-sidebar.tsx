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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

type NavItem = { icon: typeof LayoutDashboard; label: string; href: string };

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Megaphone, label: "Campaigns", href: "/campaigns" },
  { icon: Layers, label: "Ad Sets", href: "/adsets" },
  { icon: ImageIcon, label: "Ads", href: "/ads" },
  { icon: Images, label: "Creatives", href: "/creatives" },
  { icon: LayoutTemplate, label: "Portal", href: "/portal" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: FileText, label: "Reports", href: "/reports" },
  { icon: ReceiptText, label: "Invoices", href: "/invoices" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Blocks, label: "Integrations", href: "/integrations" },
  { icon: UsersRound, label: "Team", href: "/team" },
];

function isActive(location: string, href: string) {
  if (href === "/") return location === "/";
  return location === href || location.startsWith(href + "/") || location.startsWith(href + "?");
}

export function NavSidebar() {
  const [location] = useLocation();
  const [logoutOpen, setLogoutOpen] = useState(false);

  function confirmLogout() {
    try {
      ["adAccount", "activeClientId", "theme", "metabs_access_ok"].forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.href = import.meta.env.BASE_URL || "/";
  }

  return (
    <>
      <aside className="sidebar-surface fixed left-0 top-[48px] z-40 flex h-[calc(100vh-48px)] w-[56px] flex-col items-center py-1.5">
        <nav className="flex flex-1 flex-col items-center gap-0.5">
          {NAV.map((item) => {
            const active = isActive(location, item.href);
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex h-[36px] w-[36px] items-center justify-center rounded transition-colors",
                        active
                          ? "bg-[#e7f3ff] text-[#1877f2]"
                          : "text-[#65676b] hover:bg-[#f0f2f5]"
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.5} />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#1c1e21] text-white text-[11px] font-medium">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-0.5 pb-1.5">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <div
                  className={cn(
                    "flex h-[36px] w-[36px] items-center justify-center rounded transition-colors",
                    isActive(location, "/settings")
                      ? "bg-[#e7f3ff] text-[#1877f2]"
                      : "text-[#65676b] hover:bg-[#f0f2f5]"
                  )}
                >
                  <Settings className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1c1e21] text-white text-[11px] font-medium">Settings</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setLogoutOpen(true)}
                className="flex h-[36px] w-[36px] items-center justify-center rounded text-[#65676b] transition-colors hover:bg-[#f0f2f5]"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1c1e21] text-white text-[11px] font-medium">Logout</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded border border-[#dadde1] bg-white p-0">
          <AlertDialogHeader className="p-5 pb-0">
            <AlertDialogTitle className="text-[15px] font-semibold text-[#1c1e21]">Log out of Meta Business Suite?</AlertDialogTitle>
            <AlertDialogDescription className="text-[12px] text-[#65676b]">
              Your workspace and client selection will be cleared on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-5">
            <AlertDialogCancel className="rounded border-[#dadde1] bg-white text-[12px] font-medium text-[#1c1e21] hover:bg-[#f0f2f5]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="rounded bg-[#1877f2] px-3.5 text-[12px] font-medium text-white hover:bg-[#166fe5]">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
