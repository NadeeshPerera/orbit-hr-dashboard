"use client";

import { CalendarDays, ShieldCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Brand } from "@/components/layout/brand";
import { useAuthStore } from "@/features/auth/auth-store";
import { LoginForm } from "@/features/auth/login-form";

const highlights = [
  { icon: Users, text: "One directory for every person on your team" },
  { icon: CalendarDays, text: "Time off requests approved in a tap" },
  { icon: ShieldCheck, text: "Workforce insights at a glance" },
];

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  return (
    <main className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Showcase panel (desktop) */}
      <section className="relative hidden overflow-hidden bg-[oklch(0.2_0.06_280)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-24 size-[28rem] animate-aurora rounded-full bg-[oklch(0.6_0.24_290)] opacity-50 blur-3xl" />
          <div className="absolute top-1/3 -right-32 size-[26rem] animate-aurora rounded-full bg-[oklch(0.65_0.17_220)] opacity-40 blur-3xl [animation-delay:-6s]" />
          <div className="absolute -bottom-40 left-1/4 size-[24rem] animate-aurora rounded-full bg-[oklch(0.7_0.18_340)] opacity-30 blur-3xl [animation-delay:-12s]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.12)_1px,transparent_0)] [background-size:28px_28px]" />
        </div>
        <div className="relative [&_span]:text-white">
          <Brand />
        </div>
        <div className="relative max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl leading-tight font-semibold tracking-tight text-balance"
          >
            People operations, beautifully simple.
          </motion.h1>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-center gap-3 text-white/85"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-white/10 backdrop-blur">
                  <Icon className="size-4" />
                </span>
                {text}
              </motion.li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">Portfolio demo · all people and data are fictional.</p>
      </section>

      {/* Sign-in panel */}
      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent lg:hidden" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">Sign in to manage your people and time off.</p>
          <LoginForm />
        </motion.div>
      </section>
    </main>
  );
}
