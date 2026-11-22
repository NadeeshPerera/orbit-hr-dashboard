"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** A template re-mounts on every navigation, which gives each page a soft entrance. */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}
