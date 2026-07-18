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
import { useInvoices, useClients, uid, type Invoice } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Draft = Omit<Invoice, "id" | "number">;

function emptyDraft(client: string): Draft {
  const today = new Date();
  const due = new Date(today.getTime() + 14 * 86400000);
  return { client, amount: 0, status: "pending", issued: today.toISOString().split("T")[0], due: due.toISOString().split("T")[0] };
}

const statusTone = (s: Invoice["status"]) => (s === "paid" ? "success" : s === "overdue" ? "danger" : "warning");

export default function InvoicesPage() {
  const [invoices, setInvoices] = useInvoices();
  const [clients] = useClients();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(""));
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  function openCreate() {
    setEditId(null);
    setDraft(emptyDraft(clients[0]?.company ?? ""));
    setOpen(true);
  }
  function openEdit(inv: Invoice) {
    setEditId(inv.id);
    setDraft({ client: inv.client, amount: inv.amount, status: inv.status, issued: inv.issued, due: inv.due });
    setOpen(true);
  }
  function save() {
    if (!draft.client || draft.amount <= 0) {
      toast({ title: "Client and amount required", variant: "destructive" });
      return;
    }
    if (editId) {
      setInvoices((prev) => prev.map((i) => (i.id === editId ? { ...i, ...draft } : i)));
      toast({ title: "Invoice updated" });
    } else {
      const num = `INV-${2045 + invoices.length}`;
      setInvoices((prev) => [{ ...draft, id: uid("in"), number: num }, ...prev]);
      toast({ title: "Invoice created" });
    }
    setOpen(false);
  }
  function confirmDelete() {
    if (!deleteId) return;
    setInvoices((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Invoice deleted" });
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Invoices"
          subtitle="Track billing across every client engagement."
          actions={
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-xl font-semibold shadow-lg shadow-primary/25">
              <Plus className="h-4 w-4" strokeWidth={3} /> New Invoice
            </Button>
          }
        />

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid</p>
            <p className="mt-2 font-display text-2xl font-bold text-success">{formatCurrency(paid)}</p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending</p>
            <p className="mt-2 font-display text-2xl font-bold text-warning">{formatCurrency(pending)}</p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Overdue</p>
            <p className="mt-2 font-display text-2xl font-bold text-destructive">{formatCurrency(overdue)}</p>
          </GlassCard>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="grid grid-cols-12 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-2">Invoice</div>
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Due</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {invoices.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="grid grid-cols-12 items-center border-b border-border/40 px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/40">
                <div className="col-span-2 font-mono text-sm font-semibold">{inv.number}</div>
                <div className="col-span-3 truncate text-sm">{inv.client}</div>
                <div className="col-span-2 font-mono text-sm font-bold">{formatCurrency(inv.amount)}</div>
                <div className="col-span-2 text-sm text-muted-foreground">{formatDate(inv.due)}</div>
                <div className="col-span-2"><StatusBadge label={inv.status} tone={statusTone(inv.status)} /></div>
                <div className="col-span-1 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(inv)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(inv.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </GlassCard>
      </PageContainer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editId ? "Edit Invoice" : "New Invoice"}</DialogTitle>
            <DialogDescription>Bill a client for managed advertising services.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Client</Label>
              <Select value={draft.client} onValueChange={(v) => setDraft({ ...draft, client: v })}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.company}>{c.company}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount ($)</Label>
                <Input type="number" value={draft.amount || ""} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })} className="h-11 font-mono" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Invoice["status"] })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Issued</Label>
                <Input type="date" value={draft.issued} onChange={(e) => setDraft({ ...draft, issued: e.target.value })} className="h-11" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Due</Label>
                <Input type="date" value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} className="h-11" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={save} className="rounded-full px-6 font-semibold shadow-md">{editId ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
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
