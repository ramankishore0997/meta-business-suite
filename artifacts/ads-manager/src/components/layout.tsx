import { ReactNode } from "react";
import { NavSidebar } from "./nav-sidebar";
import { TopHeader } from "./top-header";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <NavSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-muted/20">
        <TopHeader />
        <main className="flex-1 overflow-hidden flex flex-col relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
