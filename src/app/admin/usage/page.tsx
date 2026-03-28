"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UsageData {
  dailyCap: number;
  monthlyCap: number;
  dailyUsed: number;
  monthlyUsed: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function AdminUsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [dailyCap, setDailyCap] = useState("");
  const [monthlyCap, setMonthlyCap] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/usage")
      .then((r) => r.json())
      .then((d: UsageData) => {
        setData(d);
        setDailyCap(String(d.dailyCap));
        setMonthlyCap(String(d.monthlyCap));
      })
      .catch(() => toast.error("Failed to load usage data"));
  }, []);

  async function handleSave() {
    const dc = parseInt(dailyCap, 10);
    const mc = parseInt(monthlyCap, 10);
    if (isNaN(dc) || isNaN(mc) || dc < 0 || mc < 0) {
      toast.error("Caps must be non-negative integers");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/usage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyCap: dc, monthlyCap: mc }),
      });
      if (!res.ok) throw new Error("Save failed");
      setData((prev) => prev ? { ...prev, dailyCap: dc, monthlyCap: mc } : prev);
      toast.success("Caps updated");
    } catch {
      toast.error("Failed to save caps");
    } finally {
      setSaving(false);
    }
  }

  const dailyPct = data ? Math.min(100, (data.dailyUsed / data.dailyCap) * 100) : 0;
  const monthlyPct = data ? Math.min(100, (data.monthlyUsed / data.monthlyCap) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-detective-slate/10 to-background">
      <div className="container mx-auto p-6 space-y-8 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Token Usage</h1>
            <p className="text-muted-foreground mt-1">Monitor usage and configure daily/monthly caps</p>
          </div>
        </div>

        <div className="grid gap-4">
          <Card className="border-detective-amber/20">
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Usage</CardTitle>
              <CardDescription>
                {data ? `${formatTokens(data.dailyUsed)} / ${formatTokens(data.dailyCap)} tokens` : "Loading…"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${dailyPct >= 90 ? "bg-destructive" : dailyPct >= 70 ? "bg-detective-amber" : "bg-primary"}`}
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{dailyPct.toFixed(1)}% of daily cap used</p>
            </CardContent>
          </Card>

          <Card className="border-detective-amber/20">
            <CardHeader>
              <CardTitle className="text-base">This Month&apos;s Usage</CardTitle>
              <CardDescription>
                {data ? `${formatTokens(data.monthlyUsed)} / ${formatTokens(data.monthlyCap)} tokens` : "Loading…"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${monthlyPct >= 90 ? "bg-destructive" : monthlyPct >= 70 ? "bg-detective-amber" : "bg-primary"}`}
                  style={{ width: `${monthlyPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{monthlyPct.toFixed(1)}% of monthly cap used</p>
            </CardContent>
          </Card>

          <Card className="border-detective-amber/20">
            <CardHeader>
              <CardTitle className="text-base">Configure Caps</CardTitle>
              <CardDescription>
                When a cap is reached, new AI evaluations return a 429 error until the period resets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="daily-cap">Daily Cap (tokens)</Label>
                <Input
                  id="daily-cap"
                  type="number"
                  min={0}
                  value={dailyCap}
                  onChange={(e) => setDailyCap(e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-cap">Monthly Cap (tokens)</Label>
                <Input
                  id="monthly-cap"
                  type="number"
                  min={0}
                  value={monthlyCap}
                  onChange={(e) => setMonthlyCap(e.target.value)}
                  placeholder="2000000"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-detective-amber text-black hover:bg-detective-amber/90"
              >
                {saving ? "Saving…" : "Save Caps"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
