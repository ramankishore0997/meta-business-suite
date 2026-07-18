import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ACCESS_PASSWORD, ACCESS_KEY } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
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
    <div className="app-aurora relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <form
        onSubmit={submit}
        className="glass-strong relative z-10 w-full max-w-sm rounded-2xl border border-border p-8 shadow-2xl duration-500 animate-in fade-in zoom-in-95"
      >
        <div className="flex flex-col items-center text-center">
          <div className="glow-primary flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-500 text-primary-foreground">
            <Lock className="h-6 w-6" strokeWidth={2.4} />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">Meta Business Suite for Developers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Private workspace — enter your password to continue.</p>
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
              className={cn("h-11 pr-10", error && "border-destructive focus-visible:ring-destructive")}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              title={show ? "Hide" : "Show"}
              tabIndex={-1}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && !locked && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> Wrong password. Try again.
            </p>
          )}
          {locked && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
              <AlertCircle className="h-3.5 w-3.5" /> Too many attempts. Wait 30 seconds.
            </p>
          )}

          <Button type="submit" disabled={locked} className="h-11 w-full rounded-xl font-semibold shadow-lg shadow-primary/25">
            Unlock
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Authorized access only
        </div>
      </form>
    </div>
  );
}
