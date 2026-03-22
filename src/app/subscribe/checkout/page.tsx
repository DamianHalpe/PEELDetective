"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  if (digits.length === 2 && value.endsWith("/")) return `${digits} / `;
  return digits;
}

function CheckoutContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/scenarios";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/login");
      return;
    }
    if ((session.user as { subscribed?: boolean }).subscribed) {
      router.replace(from);
    }
  }, [session, isPending, router, from]);

  const isFormValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.replace(/\s/g, "").replace("/", "").length === 4 &&
    cvc.length >= 3 &&
    cardName.trim().length > 0;

  async function handlePay() {
    if (!isFormValid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscribe", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Payment failed");
      }
      setSuccess(true);
      // Full navigation so the session re-hydrates with subscribed: true
      setTimeout(() => { window.location.href = from; }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  if (isPending || (session && (session.user as { subscribed?: boolean }).subscribed && !success)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-detective-amber" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold">Subscription Activated!</h2>
        <p className="text-muted-foreground">Your account now has full access. Redirecting…</p>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Link
        href={`/subscribe?from=${encodeURIComponent(from)}`}
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pricing
      </Link>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Payment form — 3/5 */}
        <div className="md:col-span-3">
          <h1 className="mb-6 text-2xl font-bold">Payment details</h1>

          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="pt-6 space-y-4">
              {/* Card number */}
              <div className="space-y-1.5">
                <Label htmlFor="card-number">Card number</Label>
                <div className="relative">
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    className="pr-10 font-mono"
                    disabled={loading}
                    autoComplete="cc-number"
                  />
                  <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Expiry + CVC */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="expiry">Expiry date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM / YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    maxLength={7}
                    className="font-mono"
                    disabled={loading}
                    autoComplete="cc-exp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    className="font-mono"
                    disabled={loading}
                    autoComplete="cc-csc"
                  />
                </div>
              </div>

              {/* Name on card */}
              <div className="space-y-1.5">
                <Label htmlFor="card-name">Name on card</Label>
                <Input
                  id="card-name"
                  placeholder="Jane Smith"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  disabled={loading}
                  autoComplete="cc-name"
                />
              </div>

              {error && (
                <p className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                className="w-full border-2 border-black bg-detective-amber text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
                onClick={handlePay}
                disabled={loading || !isFormValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay $10.00
                  </>
                )}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Simulated payment — no real charge will occur
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order summary — 2/5 */}
        <div className="md:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Order summary
          </h2>
          <Card className="border-detective-amber/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detective Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly plan</span>
                <span>$10.00</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total today</span>
                <span className="text-detective-amber">$10.00</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Then $10.00 / month. Cancel any time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-detective-amber" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
