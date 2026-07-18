import { useState } from "react";
import { Layout } from "@/components/layout";
import { PageContainer, PageHeader, GlassCard, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useClients, uid, type Client } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import { Plus, Pencil, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

type Draft = Omit<Client, "id" | "createdAt">;
const EMPTY: Draft = { name: "", company: "", email: "", status: "onboarding", monthlyBudget: 0, logoColor: PALETTE[0] };

export default function ClientsPage() {
  const [clients, setClients] = useClients();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalBudget = clients.reduce((s, c) => s + c.monthlyBudget, 0);
  const activeCount = clients.filter((c) => c.status === "active").length;

  function openCreate() {
    setEditId(null);
    setDraft({ ...EMPTY, logoColor: PALETTE[clients.length % PALETTE.length] });
    setOpen(true);
  }
  function openEdit(c: Client) {
    setEditId(c.id);
    setDraft({ name: c.name, company: c.company, email: c.email, status: c.status, monthlyBudget: c.monthlyBudget, logoColor: c.logoColor });
    setOpen(true);
  }
  function save() {
    if (!draft.company.trim()) {
      toast({ title: "Company name required", variant: "destructive" });
      return;
    }
    if (editId) {
      setClients((prev) => prev.map((c) => (c.id === editId ? { ...c, ...draft } : c)));
      toast({ title: "Client updated" });
    } else {
      setClients((prev) => [...prev, { ...draft, id: uid("cl"), createdAt: new Date().toISOString().split("T")[0] }]);
      toast({ title: "Client added" });
    }
    setOpen(false);
  }
  function confirmDelete() {
    if (!deleteId) return;
    setClients((prev) => prev.filter((c) => c.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Client removed" });
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Clients"
          subtitle="Manage the brands you run advertising for."
          actions={
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-xl font-semibold shadow-lg shadow-primary/25">
              <Plus className="h-4 w-4" strokeWidth={3} /> Add Client
            </Button>
          }
        />

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Clients</p>
            <p className="mt-2 font-display text-2xl font-bold">{clients.length}</p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="mt-2 font-display text-2xl font-bold text-success">{activeCount}</p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Managed Budget / mo</p>
            <p className="mt-2 font-display text-2xl font-bold text-primary">{formatCurrency(totalBudget)}</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <GlassCard key={c.id} hover className="group relative p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: c.logoColor }}>
                  {c.company.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-semibold">{c.company}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.name}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge label={c.status} tone={c.status === "active" ? "success" : c.status === "onboarding" ? "primary" : "muted"} />
                <span className="font-mono text-sm font-bold text-primary">{formatCurrency(c.monthlyBudget)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {c.email || "—"}
              </div>
              <div className="mt-4 flex gap-2 border-t border-border/60 pt-3">
                <Button variant="ghost" size="sm" className="h-8 flex-1 gap-1.5 rounded-lg text-xs" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 flex-1 gap-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      </PageContainer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editId ? "Edit Client" : "Add Client"}</DialogTitle>
            <DialogDescription>Client details are used across reports and invoices.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Company</Label>
              <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} placeholder="Acme Inc." className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Jane Doe" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="jane@acme.com" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Monthly Budget ($)</Label>
                <Input type="number" value={draft.monthlyBudget || ""} onChange={(e) => setDraft({ ...draft, monthlyBudget: Number(e.target.value) })} className="h-11 font-mono" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Client["status"] })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Brand Color</Label>
              <div className="flex gap-2">
                {PALETTE.map((p) => (
                  <button key={p} onClick={() => setDraft({ ...draft, logoColor: p })} className={`h-8 w-8 rounded-lg transition-transform ${draft.logoColor === p ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-110"}`} style={{ backgroundColor: p }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={save} className="rounded-full px-6 font-semibold shadow-md">{editId ? "Save" : "Add Client"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this client?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
