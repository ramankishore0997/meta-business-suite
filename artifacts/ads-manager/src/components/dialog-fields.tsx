import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

export function MoneyInput({
  id,
  value,
  onChange,
  placeholder = "0.00",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative group">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium group-focus-within:text-primary transition-colors">
        $
      </span>
      <Input
        id={id}
        type="number"
        min="0"
        step="0.01"
        className="pl-8 font-mono bg-muted/30 focus-visible:bg-transparent"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SpendAndCostFields({
  amount,
  onAmountChange,
  costPerResult,
  onCostPerResultChange,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  costPerResult: string;
  onCostPerResultChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Performance Generator</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-sm">
            Enter an amount spent to simulate real-time metrics. Set a cost per result to tune the outcome.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <Field label="Amount spent (USD)" htmlFor="field-amount">
          <MoneyInput id="field-amount" value={amount} onChange={onAmountChange} />
        </Field>
        <Field
          label="Cost per result (USD)"
          htmlFor="field-cpr"
        >
          <MoneyInput
            id="field-cpr"
            value={costPerResult}
            onChange={onCostPerResultChange}
            placeholder="Auto-calculated"
          />
        </Field>
      </div>
    </div>
  );
}
