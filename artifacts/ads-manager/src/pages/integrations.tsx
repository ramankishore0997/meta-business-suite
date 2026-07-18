import { useMemo } from "react";
import { Layout } from "@/components/layout";
import { PageContainer, PageHeader, GlassCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, Plug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useIntegrations();
  const { toast } = useToast();

  const categories = useMemo(() => {
    const map = new Map<string, typeof integrations>();
    for (const i of integrations) {
      const arr = map.get(i.category) ?? [];
      arr.push(i);
      map.set(i.category, arr);
    }
    return Array.from(map.entries());
  }, [integrations]);

  const connectedCount = integrations.filter((i) => i.connected).length;

  function toggle(id: string) {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i))
    );
    const item = integrations.find((i) => i.id === id);
    toast({ title: item?.connected ? `${item.name} disconnected` : `${item?.name} connected` });
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Integrations"
          subtitle={`${connectedCount} of ${integrations.length} services connected.`}
        />

        {categories.map(([category, items]) => (
          <div key={category} className="mb-7">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((i) => (
                <GlassCard key={i.id} hover className="flex flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ backgroundColor: i.accent }}>
                      <Plug className="h-5 w-5" />
                    </div>
                    {i.connected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                        <Check className="h-3 w-3" /> Connected
                      </span>
                    )}
                  </div>
                  <p className="mt-4 font-display text-base font-semibold">{i.name}</p>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{i.description}</p>
                  <Button
                    variant={i.connected ? "outline" : "default"}
                    className={cn("mt-4 h-9 w-full rounded-xl font-semibold", !i.connected && "shadow-lg shadow-primary/25")}
                    onClick={() => toggle(i.id)}
                  >
                    {i.connected ? "Disconnect" : "Connect"}
                  </Button>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </PageContainer>
    </Layout>
  );
}
