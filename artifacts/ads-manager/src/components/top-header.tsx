import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Search,
  Bell,
  HelpCircle,
} from "lucide-react";

const STORAGE_KEY = "adAccount";
const DEFAULT_ACCOUNT = { name: "Meta Business Suite", id: "392019485" };
type Account = { name: string; id: string };

function loadAccount(): Account {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Account>;
      return {
        name: parsed.name?.trim() || DEFAULT_ACCOUNT.name,
        id: parsed.id?.trim() || DEFAULT_ACCOUNT.id,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACCOUNT;
}

export function TopHeader() {
  const [account, setAccount] = useState<Account>(DEFAULT_ACCOUNT);
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [idDraft, setIdDraft] = useState("");

  useEffect(() => setAccount(loadAccount()), []);

  function save() {
    const next: Account = {
      name: nameDraft.trim() || DEFAULT_ACCOUNT.name,
      id: idDraft.trim() || DEFAULT_ACCOUNT.id,
    };
    setAccount(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <>
      <header className="navbar-surface fixed left-0 right-0 top-0 z-50 flex h-[48px] items-center justify-between px-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
          <span className="text-[13px] font-semibold text-[#1c1e21]">Ads Manager</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 rounded border border-[#dadde1] bg-[#f0f2f5] px-2 py-1 transition-colors focus-within:bg-white focus-within:border-[#1877f2]">
            <Search className="h-3.5 w-3.5 text-[#65676b]" />
            <input
              type="text"
              placeholder="Search"
              className="w-[160px] bg-transparent text-[12px] text-[#1c1e21] outline-none placeholder:text-[#8d949e]"
            />
          </div>

          <button className="flex h-[32px] w-[32px] items-center justify-center rounded text-[#65676b] transition-colors hover:bg-[#f0f2f5]">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button className="relative flex h-[32px] w-[32px] items-center justify-center rounded text-[#65676b] transition-colors hover:bg-[#f0f2f5]">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-[6px] w-[6px] rounded-full bg-[#d32f2f] ring-1 ring-white" />
          </button>

          <button
            onClick={() => { setNameDraft(account.name); setIdDraft(account.id); setOpen(true); }}
            className="flex items-center gap-1.5 rounded border border-[#dadde1] bg-white px-1.5 py-1 transition-colors hover:bg-[#f0f2f5]"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-[#1877f2] text-[10px] font-bold text-white">
                {account.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-[12px] font-medium text-[#1c1e21] md:block">{account.name}</span>
            <ChevronDown className="hidden h-3 w-3 text-[#65676b] md:block" />
          </button>
        </div>
      </header>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded border border-[#dadde1] p-0">
          <div className="p-5 pb-0">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold text-[#1c1e21]">Workspace</DialogTitle>
              <DialogDescription className="text-[12px] text-[#65676b]">Configure your agency workspace name and billing ID.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="grid gap-1.5">
                <Label className="text-[11px] font-semibold text-[#65676b]">Workspace Name</Label>
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="e.g. Meta Business Suite" className="input-focus h-8 rounded border-[#dadde1] text-[12px]" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[11px] font-semibold text-[#65676b]">Billing ID</Label>
                <Input value={idDraft} onChange={(e) => setIdDraft(e.target.value)} placeholder="e.g. 392019485" className="input-focus h-8 rounded border-[#dadde1] font-mono text-[12px]" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-1.5 border-t border-[#dadde1] bg-[#f5f6f8] p-3">
            <Button variant="ghost" onClick={() => setOpen(false)} className="btn-meta rounded text-[12px] font-medium text-[#65676b]">Cancel</Button>
            <Button onClick={save} className="btn-primary rounded px-3.5 text-[12px] font-medium text-white">Save Details</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
