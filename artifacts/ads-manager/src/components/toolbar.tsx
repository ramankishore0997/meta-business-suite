import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateDialog } from "@/components/create-dialog";

export type Crumb = { label: string; href?: string };

export function Toolbar({ breadcrumb }: { breadcrumb?: Crumb[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  const crumbs: Crumb[] | null = breadcrumb && breadcrumb.length > 0 ? breadcrumb : null;

  return (
    <div className="flex flex-col bg-card relative">
      {crumbs && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
          <div className="flex items-center">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              const content = (
                <span
                  className={cn(
                    "text-sm transition-colors",
                    isLast
                      ? "text-foreground font-bold tracking-tight"
                      : "text-muted-foreground font-semibold hover:text-foreground cursor-pointer"
                  )}
                >
                  {crumb.label}
                </span>
              );
              return (
                <div key={`${crumb.label}-${i}`} className="flex items-center">
                  {i > 0 && (
                    <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/40" />
                  )}
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href}>{content}</Link>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-9 px-4 rounded-full font-semibold shadow-md transition-all"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={3} />
            Create
          </Button>
          <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
      </div>
    </div>
  );
}
