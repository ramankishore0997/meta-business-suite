import { ReactNode } from "react";
import { NavSidebar } from "./nav-sidebar";
import { TopHeader } from "./top-header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f0f2f5]">
      <TopHeader />
      <NavSidebar />
      <main className="ml-[56px] mt-[48px] flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
