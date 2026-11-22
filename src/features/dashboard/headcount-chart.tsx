"use client";

import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import type { HeadcountPoint } from "@/lib/api/types";

const monthLabel = (key: string) => format(new Date(`${key}-01T00:00:00`), "MMM");

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: HeadcountPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold">{format(new Date(`${p.month}-01T00:00:00`), "MMMM yyyy")}</p>
      <p>Headcount: <span className="font-medium tabular-nums">{p.headcount}</span></p>
      <p className="text-success">Hires: {p.hires}</p>
      <p className="text-danger">Exits: {p.exits}</p>
    </div>
  );
}

export function HeadcountChart({ data }: { data: HeadcountPoint[] }) {
  const hires = data.reduce((s, p) => s + p.hires, 0);
  const exits = data.reduce((s, p) => s + p.exits, 0);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Headcount</CardTitle>
          <CardDescription>
            Last 12 months · <span className="text-success">+{hires} hires</span> · <span className="text-danger">−{exits} exits</span>
          </CardDescription>
        </div>
      </CardHeader>
      <figure className="h-64 px-2 pb-3" aria-label="Headcount over the last 12 months">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="hc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
            <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} domain={["dataMin - 5", "dataMax + 3"]} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }} />
            <Area type="monotone" dataKey="headcount" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#hc-fill)" animationDuration={1100} />
          </AreaChart>
        </ResponsiveContainer>
        <figcaption className="sr-only">
          {data.map((p) => `${monthLabel(p.month)}: ${p.headcount} people`).join(", ")}
        </figcaption>
      </figure>
    </Card>
  );
}
