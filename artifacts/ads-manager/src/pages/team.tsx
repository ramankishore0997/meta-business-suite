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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTeam, uid, type TeamMember } from "@/lib/store";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PALETTE = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
const ROLES: TeamMember["role"][] = ["Owner", "Admin", "Manager", "Analyst", "Viewer"];

type Draft = Omit<TeamMember, "id">;
const EMPTY: Draft = { name: "", email: "", role: "Analyst", status: "invited", color: PALETTE[0] };

export default function TeamPage() {
  const [team, setTeam] = useTeam();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openCreate() {
    setEditId(null);
    setDraft({ ...EMPTY, color: PALETTE[team.length % PALETTE.length] });
    setOpen(true);
  }
  function openEdit(m: TeamMember) {
    setEditId(m.id);
    setDraft({ name: m.name, email: m.email, role: m.role, status: m.status, color: m.color });
    setOpen(true);
  }
  function save() {
    if (!draft.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (editId) {
      setTeam((prev) => prev.map((m) => (m.id === editId ? { ...m, ...draft } : m)));
      toast({ title: "Member updated" });
    } else {
      setTeam((prev) => [...prev, { ...draft, id: uid("tm") }]);
      toast({ title: "Invite sent" });
    }
    setOpen(false);
  }
  function confirmDelete() {
    if (!deleteId) return;
    setTeam((prev) => prev.filter((m) => m.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Member removed" });
  }

  return (
    <Layout>
      <PageContainer>
        <PageHeader
          title="Team"
          subtitle="Invite teammates and manage their access levels."
          actions={
            <Button onClick={openCreate} className="h-9 gap-1.5 rounded-xl font-semibold shadow-lg shadow-primary/25">
              <UserPlus className="h-4 w-4" /> Invite Member
            </Button>
          }
        />

        <GlassCard className="overflow-hidden">
          <div className="grid grid-cols-12 border-b border-border/60 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Member</div>
            <div className="col-span-3">Role</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {team.map((m) => (
            <div key={m.id} className="grid grid-cols-12 items-center border-b border-border/40 px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/40">
              <div className="col-span-5 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: m.color }}>
                    {m.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
              </div>
              <div className="col-span-3">
                <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold">{m.role}</span>
              </div>
              <div className="col-span-2">
                <StatusBadge label={m.status} tone={m.status === "active" ? "success" : "warning"} />
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(m)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteId(m.id)} disabled={m.role === "Owner"}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </GlassCard>
      </PageContainer>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editId ? "Edit Member" : "Invite Member"}</DialogTitle>
            <DialogDescription>Set the teammate's name, email and access role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Jane Doe" className="h-11" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="jane@agency.com" className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Role</Label>
                <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as TeamMember["role"] })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as TeamMember["status"] })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={save} className="rounded-full px-6 font-semibold shadow-md">{editId ? "Save" : "Send Invite"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this member?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access to the workspace.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
