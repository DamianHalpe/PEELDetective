"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

const PERKS = [
  "Submit PEEL case reports for AI evaluation",
  "Receive detailed scores on all 4 PEEL elements",
  "View model answers and in-depth feedback",
  "Track your score history and earn detective badges",
];

function SubscribeContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/scenarios";

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

  if (isPending || (session && (session.user as { subscribed?: boolean }).subscribed)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-detective-amber" />
      </div>
    );
  }

  const checkoutHref = `/subscribe/checkout?from=${encodeURIComponent(from)}`;

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <Link
        href={from}
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-detective-amber/10 border-2 border-detective-amber/30">
          <CreditCard className="h-8 w-8 text-detective-amber" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Detective Subscription</h1>
        <p className="mt-2 text-muted-foreground">
          Everything you need to submit cases and receive AI-powered feedback.
        </p>
      </div>

      <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-detective-amber/10 pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">Monthly Plan</span>
            <div className="text-right">
              <span className="text-3xl font-black text-detective-amber">$10</span>
              <span className="text-sm text-muted-foreground"> / month</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="mb-6 space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span className="text-sm">{perk}</span>
              </li>
            ))}
          </ul>

          <div className="mb-5 flex items-center gap-2 rounded-lg border border-detective-amber/20 bg-detective-amber/5 px-3 py-2.5">
            <RefreshCw className="h-4 w-4 shrink-0 text-detective-amber" />
            <p className="text-xs text-muted-foreground">
              Renews automatically every 30 days. Cancel any time.
            </p>
          </div>

          <Button
            asChild
            className="w-full border-2 border-black bg-detective-amber text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
          >
            <Link href={checkoutHref}>
              Subscribe for $10 / month →
            </Link>
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Payment is simulated — no real charge will occur.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-detective-amber" /></div>}>
      <SubscribeContent />
    </Suspense>
  );
}
