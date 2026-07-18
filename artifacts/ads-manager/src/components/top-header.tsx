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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <header className="navbar-surface fixed left-0 right-0 top-0 z-50 flex h-[56px] items-center justify-between px-4">
        {/* Left - Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            <span className="text-[14px] font-semibold text-[#1c1e21]">Ads Manager</span>
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[#e4e6eb] bg-[#f0f2f5] px-3 py-1.5 shadow-inner transition-all focus-within:bg-white focus-within:border-[#1877f2] focus-within:shadow-[0_0_0_2px_rgba(24,119,242,0.15)]">
            <Search className="h-4 w-4 text-[#65676b]" />
            <input
              type="text"
              placeholder="Search"
              className="w-[180px] bg-transparent text-[13px] text-[#1c1e21] outline-none placeholder:text-[#999]"
            />
          </div>

          <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[#65676b] transition-all hover:bg-[#f0f2f5] hover:shadow-sm active:scale-95">
            <HelpCircle className="h-5 w-5" />
          </button>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#65676b] transition-all hover:bg-[#f0f2f5] hover:shadow-sm active:scale-95">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#d32f2f] ring-2 ring-white" />
          </button>

          {/* Account selector */}
          <button
            onClick={() => { setNameDraft(account.name); setIdDraft(account.id); setOpen(true); }}
            className="flex items-center gap-2 rounded-lg border border-[#e4e6eb] bg-white px-2 py-1 shadow-sm transition-all hover:bg-[#f0f2f5] hover:shadow-md active:scale-[0.98]"
          >
            <Avatar className="h-7 w-7 shadow-sm">
              <AvatarFallback className="bg-[#1877f2] text-[11px] font-bold text-white shadow-inner">
                {account.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-[13px] font-semibold text-[#1c1e21] md:block">{account.name}</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#65676b] md:block" />
          </button>
        </div>
      </header>

      {/* Workspace editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-lg border border-[#e4e6eb] p-0 shadow-2xl">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold text-[#1c1e21]">Workspace</DialogTitle>
              <DialogDescription className="text-[13px] text-[#666]">Configure your agency workspace name and billing ID.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-5">
              <div className="grid gap-2">
                <Label className="text-[12px] font-semibold text-[#666]">Workspace Name</Label>
                <Input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="e.g. Meta Business Suite" className="input-focus h-10 rounded-lg border-[#e4e6eb] text-[13px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[12px] font-semibold text-[#666]">Billing ID</Label>
                <Input value={idDraft} onChange={(e) => setIdDraft(e.target.value)} placeholder="e.g. 392019485" className="input-focus h-10 rounded-lg border-[#e4e6eb] font-mono text-[13px]" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#e4e6eb] bg-[#f7f8fa] p-4">
            <Button variant="ghost" onClick={() => setOpen(false)} className="btn-meta rounded-lg text-[13px] font-semibold text-[#666]">Cancel</Button>
            <Button onClick={save} className="btn-primary rounded-lg px-5 text-[13px] font-semibold text-white">Save Details</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
