"use client";

import { ArrowLeft, Check } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { ALL_NAV_ITEMS } from "@/lib/nav";

/** Placeholder for modules on the roadmap (see docs/ROADMAP.md). */
export function ComingSoon({ href, planned }: { href: string; planned: string[] }) {
  const item = ALL_NAV_ITEMS.find((i) => i.href === href)!;
  const Icon = item.icon;
  return (
    <Card className="relative mx-auto mt-4 max-w-2xl overflow-hidden p-8 text-center sm:p-12">
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <motion.div
        initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-primary"
      >
        <Icon className="size-7" />
      </motion.div>
      <h1 className="relative mt-6 text-2xl font-semibold tracking-tight">{item.label} is on the way</h1>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">This module is on the roadmap. Here&apos;s what it will include:</p>
      <ul className="relative mx-auto mt-6 max-w-sm space-y-2.5 text-left text-sm">
        {planned.map((p, i) => (
          <motion.li key={p} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="flex items-start gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
              <Check className="size-3" />
            </span>
            {p}
          </motion.li>
        ))}
      </ul>
      <Button asChild variant="outline" className="relative mt-8">
        <Link href="/dashboard">
          <ArrowLeft /> Back to dashboard
        </Link>
      </Button>
    </Card>
  );
}
