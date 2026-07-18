import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ACCESS_PASSWORD, ACCESS_KEY } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function isAuthed(): boolean {
  try {
    return localStorage.getItem(ACCESS_KEY) === "1";
  } catch {
    return false;
  }
}

export function AccessGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(isAuthed);
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  useEffect(() => {
    if (lockedUntil > Date.now()) {
      const t = setTimeout(() => setLockedUntil(0), lockedUntil - Date.now());
      return () => clearTimeout(t);
    }
    return undefined;
  }, [lockedUntil]);

  if (authed) return <>{children}</>;

  const locked = Date.now() < lockedUntil;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (locked) return;
    if (value === ACCESS_PASSWORD) {
      try {
        localStorage.setItem(ACCESS_KEY, "1");
      } catch {
        // ignore storage failures
      }
      setAuthed(true);
      return;
    }
    const next = attempts + 1;
    setError(true);
    setValue("");
    if (next >= 5) {
      setLockedUntil(Date.now() + 30_000);
      setAttempts(0);
    } else {
      setAttempts(next);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[#e4e6eb] bg-white p-8 shadow-xl">
        <form onSubmit={submit}>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f3ff] shadow-md">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            </div>
            <h1 className="mt-5 text-[18px] font-semibold text-[#1c1e21]">Meta Business Suite for Developers</h1>
            <p className="mt-1 text-[13px] text-[#666]">Private workspace — enter your password to continue.</p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <Input
                type={show ? "text" : "password"}
                value={value}
                autoFocus
                disabled={locked}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(false);
                }}
                placeholder="Password"
                className={cn("input-focus h-10 rounded-lg border-[#e4e6eb] pr-10 text-[13px]", error && "border-[#d32f2f] shadow-[0_0_0_2px_rgba(211,47,47,0.15)]")}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666] transition-colors hover:text-[#1c1e21]"
                title={show ? "Hide" : "Show"}
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && !locked && (
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#d32f2f]">
                <AlertCircle className="h-3.5 w-3.5" /> Wrong password. Try again.
              </p>
            )}
            {locked && (
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-[#f57f17]">
                <AlertCircle className="h-3.5 w-3.5" /> Too many attempts. Wait 30 seconds.
              </p>
            )}

            <Button type="submit" disabled={locked} className="btn-primary h-10 w-full rounded-lg font-semibold text-white">
              Unlock
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#666]">
            <ShieldCheck className="h-3.5 w-3.5" /> Authorized access only
          </div>
        </form>
      </div>
    </div>
  );
}
