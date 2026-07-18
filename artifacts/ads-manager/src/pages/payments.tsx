import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { Wallet, Copy, Check, CheckCircle2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Coin = "BTC" | "ETH" | "USDT" | "USDC";

type Payment = {
  id: string;
  coin: Coin;
  amountUsd: number;
  cryptoAmount: number;
  address: string;
  note: string;
  status: "Pending" | "Confirmed";
  date: string;
};

const COIN_RATES: Record<Coin, number> = {
  BTC: 65000,
  ETH: 3500,
  USDT: 1,
  USDC: 1,
};

const AGENCY_WALLETS: Record<Coin, string> = {
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  ETH: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  USDT: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  USDC: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
};

const STORAGE_KEY = "cryptoPayments";

export default function PaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [coin, setCoin] = useState<Coin>("USDT");
  const [usdAmount, setUsdAmount] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"Pending" | "Confirmed">("Pending");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPayments(JSON.parse(stored));
    } catch {}
  }, []);

  const savePayments = (newPayments: Payment[]) => {
    setPayments(newPayments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPayments));
  };

  const cryptoAmount = parseFloat(usdAmount) / COIN_RATES[coin] || 0;

  const handleAddPayment = () => {
    if (!usdAmount || !address) {
      toast({ title: "Missing fields", variant: "destructive" });
      return;
    }

    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      coin,
      amountUsd: parseFloat(usdAmount),
      cryptoAmount,
      address,
      note,
      status,
      date: new Date().toISOString()
    };

    savePayments([newPayment, ...payments]);
    setUsdAmount("");
    setAddress("");
    setNote("");
    toast({ title: "Payment added" });
  };

  const markConfirmed = (id: string) => {
    savePayments(payments.map(p => p.id === id ? { ...p, status: "Confirmed" } : p));
    toast({ title: "Payment confirmed" });
  };

  const deletePayment = (id: string) => {
    savePayments(payments.filter(p => p.id !== id));
    toast({ title: "Payment deleted" });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const totalReceived = payments.filter(p => p.status === "Confirmed").reduce((acc, p) => acc + p.amountUsd, 0);
  const pendingCount = payments.filter(p => p.status === "Pending").length;
  const confirmedCount = payments.filter(p => p.status === "Confirmed").length;

  return (
    <Layout>
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight">Crypto Payments</h2>
              <p className="text-muted-foreground text-sm">Track and manage inbound client payments.</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-md bg-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-primary uppercase">Total Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono tracking-tight text-primary">
                  {formatCurrency(totalReceived)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Confirmed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{confirmedCount} payments</div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-amber-500">{pendingCount} payments</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Add Payment Form */}
            <Card className="col-span-1 border-none shadow-md">
              <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                <CardTitle className="text-base">Record Payment</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Coin</label>
                  <Select value={coin} onValueChange={(c: Coin) => setCoin(c)}>
                    <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT (Tether)</SelectItem>
                      <SelectItem value="USDC">USDC (Coinbase)</SelectItem>
                      <SelectItem value="BTC">Bitcoin</SelectItem>
                      <SelectItem value="ETH">Ethereum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Amount (USD)</label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={usdAmount} 
                    onChange={(e) => setUsdAmount(e.target.value)}
                    className="h-11 font-mono bg-muted/30"
                  />
                  {usdAmount && (
                    <p className="text-xs text-muted-foreground font-mono">
                      ≈ {cryptoAmount.toFixed(6)} {coin}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Sender Wallet</label>
                  <Input 
                    placeholder="0x..." 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    className="h-11 font-mono text-sm bg-muted/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Status</label>
                  <Select value={status} onValueChange={(s: any) => setStatus(s)}>
                    <SelectTrigger className="h-11 bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Note (Optional)</label>
                  <Input 
                    placeholder="e.g. Client X deposit" 
                    value={note} 
                    onChange={(e) => setNote(e.target.value)}
                    className="h-11 bg-muted/30"
                  />
                </div>

                <Button className="w-full h-11 font-bold mt-2" onClick={handleAddPayment}>
                  Add Payment
                </Button>
              </CardContent>
            </Card>

            <div className="col-span-1 lg:col-span-2 space-y-8">
              
              {/* Receiving Wallets */}
              <Card className="border border-primary/20 bg-primary/5 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm uppercase text-primary tracking-wider">Agency Wallets</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Object.entries(AGENCY_WALLETS) as [Coin, string][]).map(([c, addr]) => (
                    <div key={c} className="bg-background rounded-lg p-3 border border-border/50 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm">{c}</div>
                        <div className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{addr}</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleCopy(addr)} className="shrink-0 h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payments List */}
              <Card className="border-none shadow-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-none">
                      <TableHead>Coin</TableHead>
                      <TableHead className="text-right">Amount (USD)</TableHead>
                      <TableHead>Sender Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          No payments recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-bold">{p.coin}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{formatCurrency(p.amountUsd)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[100px]">{p.address}</span>
                              <button onClick={() => handleCopy(p.address)} className="text-muted-foreground hover:text-foreground">
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                            {p.note && <div className="text-muted-foreground mt-0.5 font-sans text-[11px]">{p.note}</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.status === "Confirmed" ? "default" : "outline"} className={p.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDate(p.date)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {p.status === "Pending" && (
                                <Button variant="ghost" size="icon" onClick={() => markConfirmed(p.id)} className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => deletePayment(p.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>

            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
