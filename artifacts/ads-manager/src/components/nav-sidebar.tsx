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
      <aside className="sidebar-surface fixed left-0 top-[56px] z-40 flex h-[calc(100vh-56px)] w-[64px] flex-col items-center border-r border-[#e4e6eb] py-2">
        <nav className="flex flex-1 flex-col items-center gap-1">
          {NAV.map((item) => {
            const active = isActive(location, item.href);
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150",
                        active
                          ? "bg-[#e7f3ff] text-[#1877f2] shadow-sm"
                          : "text-[#65676b] hover:bg-[#f0f2f5] hover:shadow-sm"
                      )}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#1c1e21] text-white text-[12px] font-medium shadow-lg">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-1 pb-2">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150",
                    isActive(location, "/settings")
                      ? "bg-[#e7f3ff] text-[#1877f2] shadow-sm"
                      : "text-[#65676b] hover:bg-[#f0f2f5] hover:shadow-sm"
                  )}
                >
                  <Settings className="h-5 w-5" strokeWidth={1.8} />
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1c1e21] text-white text-[12px] font-medium shadow-lg">Settings</TooltipContent>
          </Tooltip>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setLogoutOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#65676b] transition-all duration-150 hover:bg-[#f0f2f5] hover:shadow-sm"
              >
                <LogOut className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1c1e21] text-white text-[12px] font-medium shadow-lg">Logout</TooltipContent>
          </Tooltip>
        </div>
      </aside>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-lg border border-[#e4e6eb] bg-white p-0 shadow-xl">
          <AlertDialogHeader className="p-6 pb-0">
            <AlertDialogTitle className="text-[16px] font-semibold text-[#1c1e21]">Log out of Meta Business Suite?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-[#666]">
              Your workspace and client selection will be cleared on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6">
            <AlertDialogCancel className="rounded-lg border-[#e4e6eb] bg-white text-[13px] font-semibold text-[#1c1e21] hover:bg-[#f0f2f5]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="btn-primary rounded-lg px-4 text-[13px] font-semibold text-white">
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
