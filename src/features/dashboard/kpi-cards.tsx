"use client";

import { CalendarDays, TrendingDown, TrendingUp, UserPlus, Users, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card } from "@/components/ui/primitives";
import type { DashboardData } from "@/lib/api/types";
import { cn } from "@/lib/utils";

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden className="hidden h-8 w-24 overflow-visible sm:block">
      <motion.polyline
        points={points}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

function Kpi({
  label,
  value,
  format,
  icon: Icon,
  tone,
  footer,
  chart,
}: {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  tone: string;
  footer: React.ReactNode;
  chart?: React.ReactNode;
}) {
  return (
    <Card className="group relative h-full overflow-hidden p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight sm:mt-2 sm:text-3xl">
            <AnimatedNumber value={value} format={format} />
          </p>
        </div>
        <span className={cn("hidden size-10 place-items-center rounded-xl transition-transform group-hover:scale-110 sm:grid", tone)}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2 text-[11px] leading-snug text-muted-foreground sm:mt-3 sm:text-xs">
        <span>{footer}</span>
        {chart}
      </div>
    </Card>
  );
}

const Trend = ({ value, suffix, invert = false }: { value: number; suffix: string; invert?: boolean }) => {
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-success" : "text-danger")}>
        <Icon className="size-3.5" />
        {value > 0 ? "+" : ""}
        {value}
      </span>
      {suffix}
    </span>
  );
};

export function KpiCards({ data }: { data: DashboardData }) {
  const items = [
    {
      label: "Headcount",
      value: data.headcount,
      icon: Users,
      tone: "bg-accent text-primary",
      footer: <Trend value={data.headcountChange} suffix="in 12 months" />,
      chart: <Sparkline values={data.headcountTrend.map((p) => p.headcount)} />,
    },
    {
      label: "New hires this quarter",
      value: data.newHiresThisQuarter,
      icon: UserPlus,
      tone: "bg-chart-2/15 text-chart-2",
      footer: "Including people still onboarding",
    },
    {
      label: "On leave today",
      value: data.onLeaveToday,
      icon: CalendarDays,
      tone: "bg-chart-4/20 text-[color-mix(in_oklab,var(--chart-4)_70%,black)] dark:text-chart-4",
      footer: `${data.pendingApprovals} requests awaiting approval`,
    },
    {
      label: "Attrition (12 mo)",
      value: data.attritionRate * 100,
      format: (n: number) => `${n.toFixed(1)}%`,
      icon: TrendingDown,
      tone: "bg-chart-5/15 text-chart-5",
      footer: "Exits ÷ average headcount",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {items.map((item, i) => (
        <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <Kpi {...item} />
        </motion.div>
      ))}
    </div>
  );
}
