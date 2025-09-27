import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { YieldMap } from "../types/api";

function parseTermToMonths(term: string): number {
  // Accepts "1 Mo", "2 Mo", "6 Mo", "1 Yr", "2 Yr", "10 Yr", etc.
  const [numStr, unit] = term.trim().split(/\s+/); // ["1","Mo"] or ["10","Yr"]
  const n = Number(numStr);
  if (!Number.isFinite(n)) return NaN;
  if (/^mo/i.test(unit)) return n; // months
  if (/^yr/i.test(unit)) return n * 12; // years → months
  return NaN;
}

function shortLabel(term: string): string {
  const [numStr, unit] = term.trim().split(/\s+/);
  const suffix = /^mo/i.test(unit) ? "M" : /^yr/i.test(unit) ? "Y" : unit;
  return `${numStr}${suffix}`;
}

function toChartData(yields: YieldMap) {
  return Object.entries(yields)
    .map(([term, bp]) => ({
      term,
      months: parseTermToMonths(term),
      pct: bp / 100, // bps → %
      label: shortLabel(term),
    }))
    .filter((d) => Number.isFinite(d.months))
    .sort((a, b) => a.months - b.months)
    .map((d) => ({ label: d.label, pct: d.pct })); // recharts rows
}

export const YieldCurveChart: React.FC<{
  yields: YieldMap;
  height?: number;
}> = ({ yields, height = 320 }) => {
  const data = React.useMemo(() => toChartData(yields), [yields]);

  return (
    <div style={{ width: "100%", height, background: "white" }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 12, right: 24, bottom: 12, left: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(2)}%`}
            label={{ value: "Yield (%)", angle: -90, position: "insideLeft" }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)}%`, "Yield"]}
            labelFormatter={(label) => `Maturity: ${label}`}
          />
          <Line type="monotone" dataKey="pct" dot strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
