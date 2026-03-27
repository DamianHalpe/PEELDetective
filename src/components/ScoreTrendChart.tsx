"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

export interface ScoreTrendDataPoint {
  date: string;
  total: number | null;
  point: number | null;
  evidence: number | null;
  explain: number | null;
  link: number | null;
}

const PEEL_ELEMENTS = [
  { key: "point", label: "Point", color: "#3b82f6" },
  { key: "evidence", label: "Evidence", color: "#22c55e" },
  { key: "explain", label: "Explain", color: "#a855f7" },
  { key: "link", label: "Link", color: "#ef4444" },
] as const;

// Scales PEEL scores (0-5) to /20 equivalent for plotting on same axis as total
function scalePeel(v: number | null): number | null {
  return v != null ? v * 4 : null;
}

// Custom tooltip — shows actual values (unscaled)
function ChartTooltip({
  active,
  payload,
  label,
  visibleLines,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  visibleLines: Set<string>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm space-y-1.5">
      <p className="font-semibold text-xs text-muted-foreground mb-1">{label}</p>
      {visibleLines.has("total") && (() => {
        const entry = payload.find((p) => p.name === "total");
        return entry ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: "oklch(0.75 0.18 75)" }}
            />
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">{entry.value}/20</span>
          </div>
        ) : null;
      })()}
      {PEEL_ELEMENTS.filter((el) => visibleLines.has(el.key)).map((el) => {
        const entry = payload.find((p) => p.name === el.key);
        if (!entry) return null;
        // Convert scaled value back to actual /5
        const actual = Math.round(entry.value / 4);
        return (
          <div key={el.key} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ background: el.color }}
            />
            <span className="text-muted-foreground">{el.label}:</span>
            <span className="font-medium">{actual}/5</span>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreTrendChart({ data }: { data: ScoreTrendDataPoint[] }) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(["total"])
  );

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Not enough data for trend (need at least 2 evaluated submissions)
      </p>
    );
  }

  // Build chart-friendly data — scale PEEL scores × 4 to plot on /20 axis
  const chartData = data.map((d, i) => ({
    label: d.date || `#${i + 1}`,
    total: d.total,
    // Store scaled values under the PEEL key so recharts plots them
    point: scalePeel(d.point),
    evidence: scalePeel(d.evidence),
    explain: scalePeel(d.explain),
    link: scalePeel(d.link),
  }));

  return (
    <div className="space-y-4">
      {/* Toggle buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Show:</span>
        <Button
          size="sm"
          variant={visibleLines.has("total") ? "default" : "outline"}
          className={
            visibleLines.has("total")
              ? "bg-detective-amber text-white hover:bg-detective-amber/90 border-detective-amber h-7 text-xs px-3"
              : "h-7 text-xs px-3"
          }
          onClick={() => toggleLine("total")}
        >
          Total
        </Button>
        {PEEL_ELEMENTS.map((el) => (
          <Button
            key={el.key}
            size="sm"
            variant={visibleLines.has(el.key) ? "secondary" : "outline"}
            className="h-7 text-xs px-3"
            style={
              visibleLines.has(el.key)
                ? { backgroundColor: el.color + "22", borderColor: el.color, color: el.color }
                : {}
            }
            onClick={() => toggleLine(el.key)}
          >
            {el.label}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 20]}
            ticks={[0, 5, 10, 15, 20]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={
                  (props.payload as unknown) as Array<{
                    name: string;
                    value: number;
                    color: string;
                  }>
                }
                label={props.label as string}
                visibleLines={visibleLines}
              />
            )}
          />
          {/* Total score line */}
          {visibleLines.has("total") && (
            <Line
              type="monotone"
              dataKey="total"
              name="total"
              stroke="oklch(0.75 0.18 75)"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "oklch(0.75 0.18 75)" }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
          {/* PEEL element lines (scaled × 4 so they share the /20 Y-axis) */}
          {PEEL_ELEMENTS.filter((el) => visibleLines.has(el.key)).map((el) => (
            <Line
              key={el.key}
              type="monotone"
              dataKey={el.key}
              name={el.key}
              stroke={el.color}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: el.color }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Scale note */}
      {Array.from(visibleLines).some((k) => k !== "total") && (
        <p className="text-xs text-muted-foreground">
          * PEEL element scores are out of 5 each; plotted scaled to /20 for comparison.
          Hover for actual values.
        </p>
      )}
    </div>
  );
}
